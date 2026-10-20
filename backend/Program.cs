
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Nexus.Api.Data;
using Nexus.Api.Models;

// --------------------------------------------------
// Application Configuration
// --------------------------------------------------

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")));

// Authentication and Authorization
builder.Services.AddAuthorization();

builder.Services.AddIdentityApiEndpoints<ApplicationUser>()
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>();

// Secure Authentication Cookies
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Lax;

    options.LoginPath = "/api/auth/login";

    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };
});

// Reverse Proxy (Nginx)
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor |
        ForwardedHeaders.XForwardedProto;
});

// CORS (Local Development)
builder.Services.AddCors(options =>
{
    options.AddPolicy("NexusFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// OpenAPI
builder.Services.AddOpenApi();


// --------------------------------------------------
// Middleware
// --------------------------------------------------

var app = builder.Build();

// Read original HTTPS information from Nginx
app.UseForwardedHeaders();

// Development-only API documentation
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("NexusFrontend");

app.UseAuthentication();
app.UseAuthorization();

// Validate origins for requests that change data
app.Use(async (context, next) =>
{
    bool modifiesData =
        HttpMethods.IsPost(context.Request.Method) ||
        HttpMethods.IsPut(context.Request.Method) ||
        HttpMethods.IsPatch(context.Request.Method) ||
        HttpMethods.IsDelete(context.Request.Method);

    if (modifiesData)
    {
        var origin = context.Request.Headers.Origin.ToString();

        // Reject requests without an Origin header
        if (string.IsNullOrEmpty(origin))
        {
            context.Response.StatusCode =
                StatusCodes.Status403Forbidden;
            return;
        }

        // Determine the allowed frontend origin
        var allowedOrigin = app.Environment.IsDevelopment()
            ? "http://localhost:5173"
            : "https://nexus.xfulcrum.dev";

        // Reject requests from other origins
        if (!string.Equals(
            origin,
            allowedOrigin,
            StringComparison.Ordinal))
        {
            context.Response.StatusCode =
                StatusCodes.Status403Forbidden;
            return;
        }
    }

    await next();
});


// --------------------------------------------------
// API Endpoints
// --------------------------------------------------

// Application Status (Authenticated)
app.MapGet("/api/status", () =>
{
    return Results.Ok(new
    {
        Application = "Nexus",
        Status = "online"
    });
})
.RequireAuthorization();


// --------------------------------------------------
// Authentication
// --------------------------------------------------

// Login
app.MapPost("/api/auth/login", async (
    LoginRequest request,
    SignInManager<ApplicationUser> signInManager) =>
{
    var result = await signInManager.PasswordSignInAsync(
        request.Email,
        request.Password,
        isPersistent: request.RememberMe,
        lockoutOnFailure: true);

    return result.Succeeded
        ? Results.Ok(new { Message = "Signed in" })
        : Results.Unauthorized();
});

// Logout
app.MapPost("/api/auth/logout", async (
    SignInManager<ApplicationUser> signInManager) =>
{
    await signInManager.SignOutAsync();

    return Results.Ok();
})
.RequireAuthorization();

// Current User
app.MapGet("/api/auth/me", async (
    System.Security.Claims.ClaimsPrincipal principal,
    UserManager<ApplicationUser> userManager) =>
{
    var user = await userManager.GetUserAsync(principal);

    if (user == null)
    {
        return Results.Unauthorized();
    }

    return Results.Ok(new
    {
        user.Id,
        user.Email,
        user.DisplayName,
        IsAdministrator = await userManager.IsInRoleAsync(
            user, "Administrator")
    });
})
.RequireAuthorization();


// --------------------------------------------------
// Personalized Bookmarks
// --------------------------------------------------

// Get the signed-in user's categories and bookmarks
app.MapGet("/api/links", async (
    System.Security.Claims.ClaimsPrincipal principal,
    UserManager<ApplicationUser> userManager,
    ApplicationDbContext db) =>
{
    var user = await userManager.GetUserAsync(principal);

    if (user == null)
    {
        return Results.Unauthorized();
    }

    var categories = await db.LinkCategories
        .AsNoTracking()
        .Where(category => category.UserId == user.Id)
        .OrderBy(category => category.DisplayOrder)
        .Select(category => new
        {
            category.Id,
            category.Name,
            category.DisplayOrder,
            Links = category.Links
                .OrderBy(link => link.DisplayOrder)
                .Select(link => new
                {
                    link.Id,
                    link.Title,
                    link.Url,
                    link.Icon,
                    link.DisplayOrder
                })
                .ToList()
        })
        .ToListAsync();

    return Results.Ok(categories);
})
.RequireAuthorization();


app.MapPost("/api/categories", async (
    CreateCategoryRequest request,
    System.Security.Claims.ClaimsPrincipal principal,
    UserManager<ApplicationUser> userManager,
    ApplicationDbContext db) =>
{
    var user = await userManager.GetUserAsync(principal);

    if (user == null)
        return Results.Unauthorized();

    var name = request.Name?.Trim();

    if (string.IsNullOrWhiteSpace(name) || name.Length > 100)
        return Results.BadRequest("Category name must be 1–100 characters.");

    var nextOrder = await db.LinkCategories
        .Where(category => category.UserId == user.Id)
        .Select(category => (int?)category.DisplayOrder)
        .MaxAsync() ?? -1;

    var category = new LinkCategory
    {
        Name = name,
        UserId = user.Id,
        DisplayOrder = nextOrder + 1
    };

    db.LinkCategories.Add(category);
    await db.SaveChangesAsync();

    return Results.Created($"/api/categories/{category.Id}", new
    {
        category.Id,
        category.Name,
        category.DisplayOrder
    });
})
.RequireAuthorization();


 // Create Bookmark
app.MapPost("/api/links", async (
    CreateBookmarkRequest request,
    System.Security.Claims.ClaimsPrincipal principal,
    UserManager<ApplicationUser> userManager,
    ApplicationDbContext db) =>
{
    var user = await userManager.GetUserAsync(principal);

    if (user == null)
        return Results.Unauthorized();

    // Confirm the category belongs to this user
    var category = await db.LinkCategories
        .FirstOrDefaultAsync(c =>
            c.Id == request.CategoryId &&
            c.UserId == user.Id);

    if (category == null)
        return Results.NotFound();

    var title = request.Title?.Trim();
    var url = request.Url?.Trim();

    if (string.IsNullOrWhiteSpace(title) || title.Length > 100)
        return Results.BadRequest("Title must be 1–100 characters.");

    if (string.IsNullOrWhiteSpace(url) ||
        url.Length > 2048 ||
        !Uri.TryCreate(url, UriKind.Absolute, out var parsedUrl) ||
        (parsedUrl.Scheme != Uri.UriSchemeHttp &&
         parsedUrl.Scheme != Uri.UriSchemeHttps))
        return Results.BadRequest("Enter a valid HTTP or HTTPS URL.");

    var nextOrder = await db.BookmarkLinks
        .Where(link => link.LinkCategoryId == category.Id)
        .Select(link => (int?)link.DisplayOrder)
        .MaxAsync() ?? -1;

    var link = new BookmarkLink
    {
        Title = title,
        Url = url,
        Icon = "link",
        LinkCategoryId = category.Id,
        DisplayOrder = nextOrder + 1
    };

    db.BookmarkLinks.Add(link);
    await db.SaveChangesAsync();

    return Results.Created($"/api/links/{link.Id}", new
    {
        link.Id,
        link.Title,
        link.Url,
        link.Icon,
        link.DisplayOrder,
        link.LinkCategoryId
    });
})
.RequireAuthorization();


// --------------------------------------------------
// Start Application
// --------------------------------------------------


if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();

    var userManager = scope.ServiceProvider
        .GetRequiredService<UserManager<ApplicationUser>>();

    await DevelopmentSeeder.SeedAsync(userManager);
}


app.Run();


// --------------------------------------------------
// Request Models
// --------------------------------------------------

public record LoginRequest(
    string Email,
    string Password,
    bool RememberMe);


public record CreateCategoryRequest(string? Name);


public record CreateBookmarkRequest(
    int CategoryId,
    string? Title,
    string? Url);

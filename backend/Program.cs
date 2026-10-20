
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
// Start Application
// --------------------------------------------------

app.Run();


// --------------------------------------------------
// Request Models
// --------------------------------------------------

public record LoginRequest(
    string Email,
    string Password,
    bool RememberMe);

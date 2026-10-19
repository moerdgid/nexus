using Microsoft.EntityFrameworkCore;
using Nexus.Api.Data;
using Microsoft.AspNetCore.Identity;
using Nexus.Api.Models;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddAuthorization();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentityApiEndpoints<ApplicationUser>()
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>();

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
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

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.LoginPath = "/api/auth/login";
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = 401;
        return Task.CompletedTask;
    };
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("NexusFrontend");
app.UseAuthentication();
app.UseAuthorization();


app.MapGet("/api/status", () =>
{
    var status = new
    {
        Application = "Nexus",
        Status = "online"
    };

    return status;
})
.RequireAuthorization();


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

app.MapPost("/api/auth/logout", async (
    SignInManager<ApplicationUser> signInManager) =>
{
    await signInManager.SignOutAsync();
    return Results.Ok();
}).RequireAuthorization();

app.MapGet("/api/auth/me", async (
    System.Security.Claims.ClaimsPrincipal principal,
    UserManager<ApplicationUser> userManager) =>
{
    var user = await userManager.GetUserAsync(principal);

    if (user == null)
        return Results.Unauthorized();

    return Results.Ok(new
    {
        user.Id,
        user.Email,
        user.DisplayName,
        IsAdministrator = await userManager.IsInRoleAsync(
            user, "Administrator")
    });
}).RequireAuthorization();


app.Run();

public record LoginRequest(
    string Email,
    string Password,
    bool RememberMe);
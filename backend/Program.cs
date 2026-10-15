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
              .AllowAnyMethod();
    });
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





if (app.Environment.IsDevelopment())
{
    app.MapPost("/api/setup/admin", async (
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IConfiguration configuration,
        AdminSetupRequest request) =>
    {
        var setupKey = configuration["AdminSetupKey"];

        if (string.IsNullOrEmpty(setupKey) ||
            request.SetupKey != setupKey)
            return Results.Unauthorized();

        var existingUser = await userManager.FindByEmailAsync(request.Email);

        if (userManager.Users.Any() && existingUser == null)
            return Results.Conflict("Another account already exists.");

        if (existingUser != null)
            return Results.Conflict("Initial account already created.");

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            DisplayName = request.DisplayName
        };

        var result = await userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
            return Results.BadRequest(result.Errors);

        if (!await roleManager.RoleExistsAsync("Administrator"))
        {
            var roleResult = await roleManager.CreateAsync(
                new IdentityRole("Administrator"));

            if (!roleResult.Succeeded)
                return Results.BadRequest(roleResult.Errors);
        }

        var assignmentResult = await userManager.AddToRoleAsync(
            user, "Administrator");

        if (!assignmentResult.Succeeded)
            return Results.BadRequest(assignmentResult.Errors);

        return Results.Ok("Initial administrator account created.");
    });
}



if (app.Environment.IsDevelopment())
{
    app.MapPost("/api/setup/repair-admin", async (
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IConfiguration configuration,
        AdminSetupRequest request) =>
    {
        if (string.IsNullOrEmpty(configuration["AdminSetupKey"]) ||
            request.SetupKey != configuration["AdminSetupKey"])
            return Results.Unauthorized();

        var users = await userManager.Users.Take(2).ToListAsync();

        if (users.Count != 1 ||
            !string.Equals(users[0].Email, request.Email,
                StringComparison.OrdinalIgnoreCase))
            return Results.Conflict("Account verification failed.");

        var user = users[0];

        if (!await userManager.CheckPasswordAsync(user, request.Password))
            return Results.Unauthorized();

        if (!await roleManager.RoleExistsAsync("Administrator"))
        {
            var result = await roleManager.CreateAsync(
                new IdentityRole("Administrator"));

            if (!result.Succeeded)
                return Results.BadRequest(result.Errors);
        }

        var assignment = await userManager.AddToRoleAsync(
            user, "Administrator");

        return assignment.Succeeded
            ? Results.Ok("Administrator role assigned.")
            : Results.BadRequest(assignment.Errors);
    });
}


app.Run();



public record AdminSetupRequest(
    string Email,
    string Password,
    string DisplayName,
    string SetupKey);
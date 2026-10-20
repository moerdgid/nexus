
using Microsoft.AspNetCore.Identity;
using Nexus.Api.Models;

namespace Nexus.Api.Data;

public static class DevelopmentSeeder
{
    public static async Task SeedAsync(
        UserManager<ApplicationUser> userManager)
    {
        const string email = "dev@nexus.local";

        // Don't create a duplicate account
        if (await userManager.FindByEmailAsync(email) != null)
        {
            return;
        }

        Console.Write("Enter development account password: ");
        var password = Console.ReadLine()
            ?? throw new InvalidOperationException("Password required.");

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            DisplayName = "Development User",
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(user, password);

        if (!result.Succeeded)
        {
            throw new InvalidOperationException(
                string.Join("; ", result.Errors.Select(e => e.Description)));
        }

        Console.WriteLine("Development account created.");
    }
}

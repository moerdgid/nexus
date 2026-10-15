using Microsoft.AspNetCore.Identity;

namespace Nexus.Api.Models;

public class ApplicationUser : IdentityUser
{
    public string? DisplayName { get; set; }
}
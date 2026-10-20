
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Nexus.Api.Models;

namespace Nexus.Api.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<LinkCategory> LinkCategories { get; set; }

    public DbSet<BookmarkLink> BookmarkLinks { get; set; }
}

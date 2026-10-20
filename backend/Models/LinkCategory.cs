
namespace Nexus.Api.Models;

public class LinkCategory
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int DisplayOrder { get; set; }

    // The Nexus account that owns this category
    public string UserId { get; set; } = string.Empty;

    public ApplicationUser User { get; set; } = null!;

    // Links belonging to this category
    public List<BookmarkLink> Links { get; set; } = new();
}
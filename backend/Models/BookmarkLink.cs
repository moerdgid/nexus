
namespace Nexus.Api.Models;

public class BookmarkLink
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Url { get; set; } = string.Empty;

    public string Icon { get; set; } = "link";

    public int DisplayOrder { get; set; }

    // Category this bookmark belongs to
    public int LinkCategoryId { get; set; }

    public LinkCategory Category { get; set; } = null!;
}

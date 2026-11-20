export type Bookmark = {
  id: number
  title: string
  url: string
  icon: string
  displayOrder: number
}
export type BookmarkCategory = {
  id: number
  name: string
  displayOrder: number
  links: Bookmark[]
}

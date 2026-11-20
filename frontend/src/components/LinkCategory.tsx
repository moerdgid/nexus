import { Code2, Layers, Clapperboard, PlayCircle, GitBranch, Link as LinkIcon, Globe, Music, Folder, ArrowUpRight } from 'lucide-react'
import type { Bookmark } from '../types/bookmarks'

const icons = { code: Code2, layers: Layers, clapperboard: Clapperboard,
  playcircle: PlayCircle, github: GitBranch, link: LinkIcon, globe: Globe,
  music: Music, folder: Folder }

export default function LinkCategory({ title, links, index }: { title: string; links: Bookmark[]; index: number }) {
  return <section className="link-category">
    <div className="category-header"><span className="category-number">{title === '' ? 'Bookmarks' : 'COLLECTION'}</span><span className="category-count">{links.length} {links.length === 1 ? 'link' : 'links'}</span></div>
    <h2>{title}</h2>
    <div className="category-links">{links.length ? links.map(link => {
      const Icon = icons[link.icon.toLowerCase() as keyof typeof icons] || LinkIcon
      return <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="bookmark-link"><span className="bookmark-icon"><Icon size={18} strokeWidth={1.6} /></span><span className="bookmark-title">{link.title}</span><ArrowUpRight size={15} className="bookmark-arrow" /></a>
    }) : <p className="category-empty">No links here yet.</p>}</div>
  </section>
}

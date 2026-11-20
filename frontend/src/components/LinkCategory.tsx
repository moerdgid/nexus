import { Code2, Layers, Clapperboard, PlayCircle, GitBranch, Link as LinkIcon, Globe, Music, Folder } from 'lucide-react'
import type { Bookmark } from '../types/bookmarks'

const icons = { code: Code2, layers: Layers, clapperboard: Clapperboard,
  playcircle: PlayCircle, github: GitBranch, link: LinkIcon, globe: Globe,
  music: Music, folder: Folder }

export default function LinkCategory({ title, links }: { title: string; links: Bookmark[] }) {
  return (
    <div className="link-category">
      <h2>{title}</h2>
      <div className="category-links">
        {links.map(link => {
          const Icon = icons[link.icon.toLowerCase() as keyof typeof icons] || LinkIcon
          return (
            <p key={link.id}>
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                <Icon size={32} />
                {link.title}
              </a>
            </p>
          )
        })}
      </div>
    </div>
  )
}

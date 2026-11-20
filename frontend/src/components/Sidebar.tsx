import { House, ListTodo, Plug, Server } from 'lucide-react'

const pages = [
  { name: 'Home', icon: House },
  { name: 'Projects', icon: ListTodo },
  { name: 'Services', icon: Plug },
  { name: 'Fulcrum', icon: Server },
]

export default function Sidebar({ activePage, onPageChange }: { activePage: string; onPageChange: (page: string) => void }) {
  return <nav className="sidebar" aria-label="Main navigation">
    <div className="sidebar-heading">Explore</div>
    <div className="sidebar-links">{pages.map(({ name, icon: Icon }) => <button key={name} className={activePage === name ? 'active' : ''} onClick={() => onPageChange(name)} aria-current={activePage === name ? 'page' : undefined}><Icon size={17} strokeWidth={1.7} /><span className="nav-label">{name}</span></button>)}</div>
    <div className="sidebar-bottom">Nexus <span> / Fulcrum</span></div>
  </nav>
}

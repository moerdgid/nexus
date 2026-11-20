import { House, ListTodo, Plug, Server, ArrowUpRight } from 'lucide-react'

const pages = [
  { name: 'Home', icon: House, number: '01' },
  { name: 'Projects', icon: ListTodo, number: '02' },
  { name: 'Services', icon: Plug, number: '03' },
  { name: 'Fulcrum', icon: Server, number: '04' },
]

export default function Sidebar({ activePage, onPageChange }: { activePage: string; onPageChange: (page: string) => void }) {
  return <nav className="sidebar" aria-label="Main navigation">
    <div className="sidebar-heading">DIRECTORY <span> / 04</span></div>
    <div className="sidebar-links">{pages.map(({ name, icon: Icon, number }) => <button key={name} className={activePage === name ? 'active' : ''} onClick={() => onPageChange(name)} aria-current={activePage === name ? 'page' : undefined}><span className="nav-number">{number}</span><Icon size={17} strokeWidth={1.7} /><span className="nav-label">{name}</span>{activePage === name && <span className="nav-indicator" />}</button>)}</div>
    <div className="sidebar-bottom"><span className="sidebar-bottom-icon">✳</span><span>THE FULCRUM<br />ENVIRONMENT</span><ArrowUpRight size={13} /></div>
  </nav>
}

import { House, ListTodo, Plug, Server } from 'lucide-react'

function Sidebar({ activePage, onPageChange }: { 
    activePage: string; 
    onPageChange: (page: string) => void 
}) {
    
    return (
        <nav  className="sidebar">
            <button 
                className={activePage === 'Home' ? 'active' : ''} 
                onClick={() => onPageChange('Home')}
            >
                <House size={24} />
                Home
            </button>
            <button
                className={activePage === 'Projects' ? 'active' : ''}
                onClick={() => onPageChange('Projects')}
            >
                <ListTodo size={24} />
                Projects
            </button>
            <button
                className={activePage === 'Services' ? 'active' : ''}
                onClick={() => onPageChange('Services')}
            >
                <Plug size={24} />
                Services
            </button>
            <button
                className={activePage === 'Fulcrum' ? 'active' : ''}
                onClick={() => onPageChange('Fulcrum')}
            >
                <Server size={24} />
                Fulcrum
            </button>
        </nav>
    )
}

export default Sidebar
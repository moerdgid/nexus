import { House, ListTodo, Plug, Server } from 'lucide-react'

function Sidebar() {
    return (
        <nav  className="sidebar">
            <button className="active">
                <House size={24} />
                Home
            </button>
            <button>
                <ListTodo size={24} />
                Projects
            </button>
            <button>
                <Plug size={24} />
                Services
            </button>
            <button>
                <Server size={24} />
                Fulcrum
            </button>
        </nav>
    )
}

export default Sidebar
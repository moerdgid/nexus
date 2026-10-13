import './App.css'
import LinkCategory from './components/LinkCategory.tsx'
import { useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { categories } from './data/links'
import Sidebar from './components/Sidebar'

function App() {

  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'dark'
  )

  return (
    <div data-theme={theme} className="app">
      <header>
        <h1>Nexus</h1>
        <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}> {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </header>
      
      <div className="app-body">
        <Sidebar />
      
        <main>
          {categories.map(category => (
            <LinkCategory
              key={category.title}
              title={category.title}
              links={category.links}
              />
          ))}
        </main>

      </div>

    </div>
  )
}
export default App

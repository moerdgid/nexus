import './App.css'
import LinkCategory from './components/LinkCategory.tsx'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { categories } from './data/links'
import Sidebar from './components/Sidebar'

function App() {

  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'dark'
  )

  const [apiStatus, setApiStatus] = useState<string>("loading");

  useEffect(() => {
    fetch("http://localhost:5227/api/status")
      .then(response => response.json())
      .then(data => setApiStatus(data.status))
      .catch(error => {
        console.error(error);
        setApiStatus("error");
      });
  }, []);

  const [activePage, setActivePage] = useState('Home')

  return (
    <div data-theme={theme} className="app">
      <header>
        
        <button
          className="logo-button"
          onClick={() => setActivePage('Home')}
          aria-label="Go to Home"
        >
          <img
            src={theme === 'dark'
              ? '/nexus-header-dark.svg'
              : '/nexus-header-light.svg'}
            alt="Nexus"
            className="header-logo"
          />
        </button>
        
        <button 
          className="theme-toggle" 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}> {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </button>

      </header>
      
      <div className="app-body">
        <Sidebar activePage={activePage} onPageChange={setActivePage} />
      
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

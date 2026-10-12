import './App.css'
import LinkCategory from './components/LinkCategory.tsx'
import { useState } from 'react'
import { Sun, Moon } from 'lucide-react'

function App() {

  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'dark'
  )

  const developmentLinks = [
    { title: 'Github', url: 'https://github.com/', icon: 'code' },
    { title: 'Stack Overflow', url: 'https://stackoverflow.com/', icon: 'layers' }
  ]

  const entertainmentLinks = [
    { title: 'Disney+', url: 'https://www.disneyplus.com', icon: 'clapperboard' },
    { title: 'Youtube', url: 'https://www.youtube.com', icon: 'playcircle' }
  ] as const

  return (
    <div data-theme={theme} className="app">
      <header>
        <h1>Nexus</h1>
        <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}> {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </header>
      
      <main>
        <LinkCategory title="Development" links={developmentLinks}/>
        <LinkCategory title="Entertainment" links={entertainmentLinks}/>

      </main>
    </div>
  )
}
export default App

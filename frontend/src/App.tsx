
import './App.css'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

import LinkCategory from './components/LinkCategory'
import Sidebar from './components/Sidebar'
import Login from './components/Login'
import { categories } from './data/links'

// User information returned by the backend
type UserProfile = {
  id: string
  email: string
  displayName: string | null
  isAdministrator: boolean
}

function App() {

  // State
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'light'
  )

  useEffect(() => {
  localStorage.setItem('theme', theme)
}, [theme])

  const [activePage, setActivePage] = useState('Home')
  const [user, setUser] = useState<UserProfile | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Functions
  async function refreshUser() {
    const response = await fetch('http://localhost:5227/api/auth/me', {
      credentials: 'include'
    })

    if (!response.ok) {
      setUser(null)
      throw new Error('Unable to load profile')
    }

    const profile: UserProfile = await response.json()
    setUser(profile)
  }

  async function logout() {
    const response = await fetch('http://localhost:5227/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Unable to sign out')
    }

    setUser(null)
  }

  // Check login when Nexus first loads
  useEffect(() => {
    refreshUser()
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false))
  }, [])

  // Loading screen
  if (authLoading) {
    return (
      <div data-theme={theme} className="app">
        Loading Nexus...
      </div>
    )
  }

  // Login screen
  if (!user) {
    return (
      <div data-theme={theme} className="app">
        <Login onLogin={refreshUser} theme={theme} />
      </div>
    )
  }

  // Main application
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

        <div className="user-profile">
          <span>{user.displayName || user.email}</span>
          {user.isAdministrator && <span> (Admin)</span>}
        </div>

        <button
          onClick={logout}
          className="logout-button"
        >
          Sign out
        </button>

        <button
          className="theme-toggle"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </button>

      </header>

      <div className="app-body">

        <Sidebar
          activePage={activePage}
          onPageChange={setActivePage}
        />

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

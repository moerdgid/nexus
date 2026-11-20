import './App.css'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import LinkCategory from './components/LinkCategory'
import Sidebar from './components/Sidebar'
import Login from './components/Login'
import BookmarkManager from './components/BookmarkManager'
import type { BookmarkCategory } from './types/bookmarks'

type UserProfile = { id: string; email: string; displayName: string | null; isAdministrator: boolean }

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [activePage, setActivePage] = useState('Home')
  const [user, setUser] = useState<UserProfile | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [bookmarkCategories, setBookmarkCategories] = useState<BookmarkCategory[]>([])
  const [bookmarkError, setBookmarkError] = useState('')

  useEffect(() => { localStorage.setItem('theme', theme) }, [theme])

  async function refreshUser() {
    const response = await fetch('/api/me', { credentials: 'include' })
    if (!response.ok) { setUser(null); throw new Error('Unable to load profile') }
    const profile: UserProfile = await response.json()
    setUser(profile)
  }

  async function loadBookmarks() {
    const response = await fetch('/api/links', { credentials: 'include' })
    if (!response.ok) throw new Error('Unable to load bookmarks')
    const data: BookmarkCategory[] = await response.json()
    setBookmarkCategories(data)
    setBookmarkError('')
  }

  async function logout() {
    const response = await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' })
    if (!response.ok) throw new Error('Unable to sign out')
    setUser(null)
    setBookmarkCategories([])
  }

  useEffect(() => {
    refreshUser().catch(() => setUser(null)).finally(() => setAuthLoading(false))
  }, [])

  useEffect(() => {
    if (user) loadBookmarks().catch(() => setBookmarkError('Unable to load bookmarks. Please refresh.'))
    else { setBookmarkCategories([]); setBookmarkError('') }
  }, [user?.id])

  if (authLoading) return <div data-theme={theme} className="app">Loading Nexus...</div>
  if (!user) return <div data-theme={theme} className="app"><Login onLogin={refreshUser} theme={theme} /></div>

  return (
    <div data-theme={theme} className="app">
      <header>
        <button className="logo-button" onClick={() => setActivePage('Home')} aria-label="Go to Home">
          <img src={theme === 'dark' ? '/nexus-header-dark.svg' : '/nexus-header-light.svg'} alt="Nexus" className="header-logo" />
        </button>
        <div className="user-profile">
          <span>{user.displayName || user.email}</span>
          {user.isAdministrator && <span> (Admin)</span>}
        </div>
        <button onClick={() => logout().catch(console.error)} className="logout-button">Sign out</button>
        <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </header>
      <div className="app-body">
        <Sidebar activePage={activePage} onPageChange={setActivePage} />
        <main>
          <div className="bookmark-toolbar"><button onClick={() => setActivePage(activePage === 'Bookmarks' ? 'Home' : 'Bookmarks')}>{activePage === 'Bookmarks' ? 'Back to dashboard' : 'Manage bookmarks'}</button></div>
          {activePage === 'Bookmarks' ? <BookmarkManager categories={bookmarkCategories} onChanged={loadBookmarks} /> : <>
          {bookmarkError && <p role="alert">{bookmarkError}</p>}
          {bookmarkCategories.map(category => (
            <LinkCategory key={category.id} title={category.name} links={category.links} />
          ))}
          </>}
        </main>
      </div>
    </div>
  )
}
export default App

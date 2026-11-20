import './App.css'
import { useEffect, useState } from 'react'
import { Sun, Moon, ArrowUpRight, SlidersHorizontal, LogOut, Bookmark } from 'lucide-react'
import LinkCategory from './components/LinkCategory.tsx'
import Sidebar from './components/Sidebar.tsx'
import Login from './components/Login.tsx'
import BookmarkManager from './components/BookmarkManager.tsx'
import type { BookmarkCategory } from './types/bookmarks'

type UserProfile = { id: string; email: string; displayName: string | null; isAdministrator: boolean }

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
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

  if (authLoading) return <div data-theme={theme} className="app loading-screen"><span className="eyebrow">Nexus</span><div className="loading-pulse" />Loading your bookmarks</div>
  if (!user) return <div data-theme={theme} className="app"><Login onLogin={refreshUser} theme={theme} /></div>

  const linkCount = bookmarkCategories.reduce((total, category) => total + category.links.length, 0)
  const isManaging = activePage === 'Bookmarks'
  const pageTitle = isManaging ? 'Manage bookmarks' : activePage === 'Home' ? 'Your bookmarks, all in one place.' : activePage
  const pageDescription = isManaging
    ? 'Add, edit, and organize your links.'
    : activePage === 'Home'
      ? 'A simple home for the sites and tools you use every day.'
      : 'This section is still in progress.'

  return (
    <div data-theme={theme} className="app">
      <div className="app-frame">
        <header className="site-header">
          <button className="logo-button" onClick={() => setActivePage('Home')} aria-label="Go to Home">
            <img src={theme === 'dark' ? '/nexus-header-dark.svg' : '/nexus-header-light.svg'} alt="Nexus" className="header-logo" />
          </button>
          <span className="header-identity">A Fulcrum project</span>
          <div className="header-actions">
            <span className="header-user">{user.displayName || user.email}</span>
            <button className="icon-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title="Toggle appearance">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => logout().catch(console.error)} className="icon-button" title="Sign out" aria-label="Sign out"><LogOut size={18} /></button>
          </div>
        </header>
        <div className="app-body">
          <Sidebar activePage={activePage} onPageChange={setActivePage} />
          <main className="main-content">
            <section className="hero" aria-labelledby="page-title">
              <div className="hero-copy">
                <div className="eyebrow">YOUR WORKSPACE</div>
                <h1 id="page-title">{pageTitle}</h1>
                <p>{pageDescription}</p>
                <div className="hero-actions">
                  <button className="primary-action" onClick={() => setActivePage(isManaging ? 'Home' : 'Bookmarks')}>
                    <SlidersHorizontal size={16} />{isManaging ? 'Return to dashboard' : 'Manage bookmarks'}<ArrowUpRight size={15} />
                  </button>
                </div>
              </div>
              <div className="hero-summary" aria-label="Bookmark summary">
                <span className="summary-label">AT A GLANCE</span>
                <div className="summary-stat"><strong>{bookmarkCategories.length}</strong><span>{bookmarkCategories.length === 1 ? 'Category' : 'Categories'}</span></div>
                <div className="summary-stat"><strong>{linkCount}</strong><span>{linkCount === 1 ? 'Saved link' : 'Saved links'}</span></div>
              </div>
            </section>
            <div className="section-bar">
              <div className="section-bar-title"><span>{isManaging ? 'Edit your bookmarks' : activePage === 'Home' ? 'Saved bookmarks' : activePage}</span></div>
              <span className="section-meta">{bookmarkCategories.length} categories <span className="meta-separator">·</span> {linkCount} links</span>
            </div>
            {isManaging ? <BookmarkManager categories={bookmarkCategories} onChanged={loadBookmarks} /> : activePage === 'Home' ? <>
              {bookmarkError && <p className="inline-error" role="alert">{bookmarkError}</p>}
              {bookmarkCategories.length ? <div className="category-grid">{bookmarkCategories.map((category, index) => <LinkCategory key={category.id} title={category.name} links={category.links} index={index + 1} />)}</div> : <div className="empty-state"><Bookmark size={34} strokeWidth={1.5} /><h2>Start your collection</h2><p>Build your directory by adding a category and a few favorite links.</p><button className="text-action" onClick={() => setActivePage('Bookmarks')}>Create your first category <ArrowUpRight size={16} /></button></div>}
            </> : <div className="empty-state"><Bookmark size={34} strokeWidth={1.5} /><h2>Coming soon</h2><p>This part of Nexus is reserved for a future update. Your bookmarks are waiting on Home.</p><button className="text-action" onClick={() => setActivePage('Home')}>Back to Home <ArrowUpRight size={16} /></button></div>}
            <footer className="site-footer"><span>Nexus · A Fulcrum project</span><span>Made for the everyday</span></footer>
          </main>
        </div>
      </div>
    </div>
  )
}
export default App

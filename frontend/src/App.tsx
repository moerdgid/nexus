import './App.css'
import { useEffect, useState } from 'react'
import { Sun, Moon, ArrowUpRight, SlidersHorizontal, LogOut, Orbit } from 'lucide-react'
import LinkCategory from './components/LinkCategory'
import Sidebar from './components/Sidebar'
import Login from './components/Login'
import BookmarkManager from './components/BookmarkManager'
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

  if (authLoading) return <div data-theme={theme} className="app loading-screen"><span className="eyebrow">NEXUS / INITIALIZING</span><div className="loading-pulse" />Connecting to your workspace</div>
  if (!user) return <div data-theme={theme} className="app"><Login onLogin={refreshUser} theme={theme} /></div>

  const linkCount = bookmarkCategories.reduce((total, category) => total + category.links.length, 0)
  const isManaging = activePage === 'Bookmarks'
  const pageTitle = isManaging ? 'Your collection.' : activePage === 'Home' ? 'Your space, organized.' : `${activePage}.`
  const pageDescription = isManaging
    ? 'Add and maintain the places you return to.'
    : activePage === 'Home'
      ? 'A quieter corner of the internet. Everything you need, right where you left it.'
      : 'A space for what comes next.'

  return (
    <div data-theme={theme} className="app">
      <div className="app-frame">
        <header className="site-header">
          <button className="logo-button" onClick={() => setActivePage('Home')} aria-label="Go to Home">
            <img src={theme === 'dark' ? '/nexus-header-dark.svg' : '/nexus-header-light.svg'} alt="Nexus" className="header-logo" />
          </button>
          <span className="header-divider" aria-hidden="true" />
          <span className="header-identity">PERSONAL INTERFACE <span className="header-dot">●</span> FULCRUM SYSTEMS</span>
          <div className="header-actions">
            <span className="header-user"><span className="status-dot" />{user.displayName || user.email}{user.isAdministrator ? ' / ADMIN' : ''}</span>
            <button className="icon-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title="Toggle appearance">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => logout().catch(console.error)} className="icon-button" title="Sign out" aria-label="Sign out"><LogOut size={18} /></button>
          </div>
        </header>
        <div className="app-body">
          <Sidebar activePage={activePage} onPageChange={setActivePage} />
          <main className="main-content">
            <div className="topline"><span>NX / 001</span><span>PERSONAL WORKSPACE</span><span className="topline-right">SYSTEM ONLINE <span className="status-dot" /></span></div>
            <section className="hero" aria-labelledby="page-title">
              <div className="hero-copy">
                <div className="eyebrow"><span className="small-square" /> THE NEXUS DIRECTORY <span className="eyebrow-line" /></div>
                <h1 id="page-title">{pageTitle}</h1>
                <p>{pageDescription}</p>
                <div className="hero-actions">
                  <button className="primary-action" onClick={() => setActivePage(isManaging ? 'Home' : 'Bookmarks')}>
                    <SlidersHorizontal size={16} />{isManaging ? 'Return to dashboard' : 'Manage bookmarks'}<ArrowUpRight size={15} />
                  </button>
                  <span className="hero-annotation">EST. MMXXVI <span aria-hidden="true">✳</span> ALWAYS IN PROGRESS</span>
                </div>
              </div>
              <div className="hero-art" aria-hidden="true">
                <div className="orbital-ring ring-one" /><div className="orbital-ring ring-two" /><div className="orbital-ring ring-three" />
                <div className="orbital-core"><span className="orbital-core-inner" /></div>
                <div className="orbit-point" />
                <span className="art-label art-label-top">FIG. 01 / NEXUS</span><span className="art-label art-label-bottom">INTERCONNECTED SYSTEMS</span>
                <span className="art-cross art-cross-one">+</span><span className="art-cross art-cross-two">+</span>
              </div>
            </section>
            <div className="section-bar">
              <div className="section-bar-title"><span className="section-index">01</span><span>{isManaging ? 'DIRECTORY EDITOR' : activePage === 'Home' ? 'YOUR DIRECTORY' : `${activePage.toUpperCase()} / OVERVIEW`}</span></div>
              <span className="section-meta">{bookmarkCategories.length.toString().padStart(2, '0')} CATEGORIES <span className="meta-separator">/</span> {linkCount.toString().padStart(2, '0')} LINKS</span>
            </div>
            {isManaging ? <BookmarkManager categories={bookmarkCategories} onChanged={loadBookmarks} /> : activePage === 'Home' ? <>
              {bookmarkError && <p className="inline-error" role="alert">{bookmarkError}</p>}
              {bookmarkCategories.length ? <div className="category-grid">{bookmarkCategories.map((category, index) => <LinkCategory key={category.id} title={category.name} links={category.links} index={index + 1} />)}</div> : <div className="empty-state"><Orbit size={38} strokeWidth={1} /><span className="eyebrow">NOTHING ON FILE / YET</span><h2>A blank slate.</h2><p>Build your directory by adding a category and a few favorite links.</p><button className="text-action" onClick={() => setActivePage('Bookmarks')}>Create your first category <ArrowUpRight size={16} /></button></div>}
            </> : <div className="empty-state"><Orbit size={38} strokeWidth={1} /><span className="eyebrow">UNDER DEVELOPMENT</span><h2>Room to grow.</h2><p>This part of Nexus is reserved for a future update. Your bookmarks are waiting on Home.</p><button className="text-action" onClick={() => setActivePage('Home')}>Back to Home <ArrowUpRight size={16} /></button></div>}
            <footer className="site-footer"><span>NEXUS <span className="footer-mark">✳</span> A FULCRUM PROJECT</span><span>DESIGNED FOR THE EVERYDAY / 2026</span><span>NX.001</span></footer>
          </main>
        </div>
      </div>
    </div>
  )
}
export default App

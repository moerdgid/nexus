import { useState } from 'react'
import type { BookmarkCategory } from '../types/bookmarks'

type Props = { categories: BookmarkCategory[]; onChanged: () => Promise<void> }

async function request(path: string, method: string, body?: object) {
  const response = await fetch(path, {
    method, credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) {
    const result = await response.json().catch(() => ({})) as { error?: string }
    throw new Error(result.error || `Request failed (${response.status})`)
  }
}

export default function BookmarkManager({ categories, onChanged }: Props) {
  const [categoryName, setCategoryName] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function run(action: () => Promise<void>) {
    setError(''); setBusy(true)
    try { await action(); await onChanged() }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to save changes') }
    finally { setBusy(false) }
  }

  return (
    <section className="bookmark-manager">
      <h2>Manage bookmarks</h2>
      <p>Add, edit, or remove your categories and links.</p>
      {error && <p role="alert">{error}</p>}
      <form onSubmit={e => {
        e.preventDefault()
        void run(async () => { await request('/api/categories', 'POST', { name: categoryName }); setCategoryName('') })
      }}>
        <label>New category <input value={categoryName} onChange={e => setCategoryName(e.target.value)} maxLength={80} required /></label>
        <button disabled={busy}>Add category</button>
      </form>
      <form onSubmit={e => {
        e.preventDefault()
        if (categoryId === '') return
        void run(async () => { await request('/api/links', 'POST', { categoryId, title, url }); setTitle(''); setUrl('') })
      }}>
        <label>Category <select value={categoryId} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : '')} required>
          <option value="">Choose category</option>
          {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select></label>
        <label>Title <input value={title} onChange={e => setTitle(e.target.value)} maxLength={120} required /></label>
        <label>URL <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://" required /></label>
        <button disabled={busy}>Add bookmark</button>
      </form>
      {categories.map(category => (
        <div className="manager-category" key={category.id}>
          <div className="manager-heading">
            <strong>{category.name}</strong>
            <button disabled={busy} onClick={() => {
              const name = window.prompt('Rename category', category.name)
              if (name !== null) void run(() => request(`/api/categories/${category.id}`, 'PATCH', { name }))
            }}>Rename</button>
            <button disabled={busy} onClick={() => {
              if (window.confirm(`Delete ${category.name} and all its bookmarks?`))
                void run(() => request(`/api/categories/${category.id}`, 'DELETE'))
            }}>Delete</button>
          </div>
          {category.links.map(link => (
            <div className="manager-link" key={link.id}>
              <span>{link.title}</span>
              <button disabled={busy} onClick={() => {
                const newTitle = window.prompt('Bookmark title', link.title)
                if (newTitle === null) return
                const newUrl = window.prompt('Bookmark URL', link.url)
                if (newUrl !== null) void run(() => request(`/api/links/${link.id}`, 'PATCH', { title: newTitle, url: newUrl }))
              }}>Edit</button>
              <button disabled={busy} onClick={() => {
                if (window.confirm(`Delete ${link.title}?`)) void run(() => request(`/api/links/${link.id}`, 'DELETE'))
              }}>Delete</button>
            </div>
          ))}
        </div>
      ))}
    </section>
  )
}

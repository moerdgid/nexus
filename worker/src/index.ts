import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { and, asc, eq, sql } from 'drizzle-orm'
import { categories, bookmarks, users } from './db/schema'
import { createAuth, type Env } from './auth'

const app = new Hono<{ Bindings: Env }>()

// Better Auth handles password hashing, session cookies, and CSRF protections.
app.on(['GET', 'POST'], '/api/auth/*', (c) => {
  return createAuth(c.env, new URL(c.req.url).origin).handler(c.req.raw)
})

async function identity(c: { env: Env; req: { raw: Request; url: string } }) {
  const auth = createAuth(c.env, new URL(c.req.url).origin)
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return null
  const db = drizzle(c.env.DB)
  // Maintain a Nexus profile with the same ID as the Better Auth user.
  await db.insert(users).values({
    id: session.user.id,
    email: session.user.email,
    displayName: session.user.name || session.user.email,
  }).onConflictDoNothing()
  return session.user
}

app.get('/api/me', async (c) => {
  const person = await identity(c)
  if (!person) return c.json({ error: 'Unauthorized' }, 401)
  return c.json({
    id: person.id,
    email: person.email,
    displayName: person.name,
    isAdministrator: !!c.env.ADMIN_EMAIL && person.email.toLowerCase() === c.env.ADMIN_EMAIL.toLowerCase(),
  })
})

app.get('/api/status', async (c) => {
  const db = drizzle(c.env.DB)
  const result = await db.get<{ value: number }>(sql`SELECT 1 AS value`)
  return c.json({ application: 'Nexus', status: 'online', database: result?.value === 1 ? 'connected' : 'error' })
})

app.get('/api/links', async (c) => {
  const person = await identity(c)
  if (!person) return c.json({ error: 'Unauthorized' }, 401)
  const db = drizzle(c.env.DB)
  const rows = await db.select().from(categories)
    .where(eq(categories.userId, person.id)).orderBy(asc(categories.displayOrder), asc(categories.id))
  const result = await Promise.all(rows.map(async (category) => ({
    id: category.id,
    name: category.name,
    displayOrder: category.displayOrder,
    links: await db.select({ id: bookmarks.id, title: bookmarks.title, url: bookmarks.url,
      icon: bookmarks.icon, displayOrder: bookmarks.displayOrder })
      .from(bookmarks).where(eq(bookmarks.categoryId, category.id))
      .orderBy(asc(bookmarks.displayOrder), asc(bookmarks.id)),
  })))
  return c.json(result)
})

// All writes require an authenticated session and explicit ownership checks.
app.post('/api/categories', async (c) => {
  const person = await identity(c)
  if (!person) return c.json({ error: 'Unauthorized' }, 401)
  const body = await c.req.json().catch(() => null) as { name?: unknown } | null
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (!name || name.length > 80) return c.json({ error: 'Name must be 1–80 characters' }, 400)
  const db = drizzle(c.env.DB)
  const [last] = await db.select({ order: categories.displayOrder }).from(categories)
    .where(eq(categories.userId, person.id)).orderBy(sql`${categories.displayOrder} DESC`).limit(1)
  const [created] = await db.insert(categories).values({ name, userId: person.id,
    displayOrder: (last?.order ?? -1) + 1 }).returning()
  return c.json(created, 201)
})

app.patch('/api/categories/:id', async (c) => {
  const person = await identity(c)
  if (!person) return c.json({ error: 'Unauthorized' }, 401)
  const id = Number(c.req.param('id'))
  const body = await c.req.json().catch(() => null) as { name?: unknown; displayOrder?: unknown } | null
  if (!Number.isSafeInteger(id) || id <= 0 || !body) return c.json({ error: 'Invalid request' }, 400)
  const changes: { name?: string; displayOrder?: number } = {}
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 80) return c.json({ error: 'Invalid name' }, 400)
    changes.name = body.name.trim()
  }
  if (body.displayOrder !== undefined) {
    if (!Number.isSafeInteger(body.displayOrder) || (body.displayOrder as number) < 0) return c.json({ error: 'Invalid order' }, 400)
    changes.displayOrder = body.displayOrder as number
  }
  if (!Object.keys(changes).length) return c.json({ error: 'No changes' }, 400)
  const db = drizzle(c.env.DB)
  const [updated] = await db.update(categories).set(changes)
    .where(and(eq(categories.id, id), eq(categories.userId, person.id))).returning()
  return updated ? c.json(updated) : c.json({ error: 'Not found' }, 404)
})

app.delete('/api/categories/:id', async (c) => {
  const person = await identity(c)
  if (!person) return c.json({ error: 'Unauthorized' }, 401)
  const id = Number(c.req.param('id'))
  if (!Number.isSafeInteger(id) || id <= 0) return c.json({ error: 'Invalid ID' }, 400)
  const db = drizzle(c.env.DB)
  const [owned] = await db.select({ id: categories.id }).from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, person.id)))
  if (!owned) return c.json({ error: 'Not found' }, 404)
  await db.batch([
    db.delete(bookmarks).where(eq(bookmarks.categoryId, id)),
    db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, person.id))),
  ])
  return c.body(null, 204)
})

function validUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048) return false
  try { const u = new URL(value); return ['http:', 'https:'].includes(u.protocol) } catch { return false }
}

app.post('/api/links', async (c) => {
  const person = await identity(c)
  if (!person) return c.json({ error: 'Unauthorized' }, 401)
  const body = await c.req.json().catch(() => null) as { categoryId?: unknown; title?: unknown; url?: unknown; icon?: unknown } | null
  const categoryId = body?.categoryId
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  if (!Number.isSafeInteger(categoryId) || (categoryId as number) <= 0 || !title || title.length > 120 || !validUrl(body?.url))
    return c.json({ error: 'Invalid bookmark' }, 400)
  const icon = typeof body?.icon === 'string' && body.icon.length <= 40 ? body.icon : 'link'
  const db = drizzle(c.env.DB)
  const [owned] = await db.select({ id: categories.id }).from(categories)
    .where(and(eq(categories.id, categoryId as number), eq(categories.userId, person.id)))
  if (!owned) return c.json({ error: 'Category not found' }, 404)
  const [last] = await db.select({ order: bookmarks.displayOrder }).from(bookmarks)
    .where(eq(bookmarks.categoryId, owned.id)).orderBy(sql`${bookmarks.displayOrder} DESC`).limit(1)
  const [created] = await db.insert(bookmarks).values({ categoryId: owned.id, title,
    url: body!.url as string, icon, displayOrder: (last?.order ?? -1) + 1 }).returning()
  return c.json(created, 201)
})

app.patch('/api/links/:id', async (c) => {
  const person = await identity(c)
  if (!person) return c.json({ error: 'Unauthorized' }, 401)
  const id = Number(c.req.param('id'))
  const body = await c.req.json().catch(() => null) as { title?: unknown; url?: unknown; icon?: unknown; displayOrder?: unknown; categoryId?: unknown } | null
  if (!Number.isSafeInteger(id) || id <= 0 || !body) return c.json({ error: 'Invalid request' }, 400)
  const db = drizzle(c.env.DB)
  const [owned] = await db.select({ id: bookmarks.id }).from(bookmarks)
    .innerJoin(categories, eq(bookmarks.categoryId, categories.id))
    .where(and(eq(bookmarks.id, id), eq(categories.userId, person.id)))
  if (!owned) return c.json({ error: 'Not found' }, 404)
  const changes: { title?: string; url?: string; icon?: string; displayOrder?: number; categoryId?: number } = {}
  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 120) return c.json({ error: 'Invalid title' }, 400)
    changes.title = body.title.trim()
  }
  if (body.url !== undefined) {
    if (!validUrl(body.url)) return c.json({ error: 'Invalid URL' }, 400)
    changes.url = body.url
  }
  if (body.icon !== undefined) {
    if (typeof body.icon !== 'string' || body.icon.length > 40) return c.json({ error: 'Invalid icon' }, 400)
    changes.icon = body.icon
  }
  if (body.displayOrder !== undefined) {
    if (!Number.isSafeInteger(body.displayOrder) || (body.displayOrder as number) < 0) return c.json({ error: 'Invalid order' }, 400)
    changes.displayOrder = body.displayOrder as number
  }
  if (body.categoryId !== undefined) {
    if (!Number.isSafeInteger(body.categoryId) || (body.categoryId as number) <= 0) return c.json({ error: 'Invalid category' }, 400)
    const [target] = await db.select({ id: categories.id }).from(categories)
      .where(and(eq(categories.id, body.categoryId as number), eq(categories.userId, person.id)))
    if (!target) return c.json({ error: 'Category not found' }, 404)
    changes.categoryId = target.id
  }
  if (!Object.keys(changes).length) return c.json({ error: 'No changes' }, 400)
  const [updated] = await db.update(bookmarks).set(changes).where(eq(bookmarks.id, id)).returning()
  return c.json(updated)
})

app.delete('/api/links/:id', async (c) => {
  const person = await identity(c)
  if (!person) return c.json({ error: 'Unauthorized' }, 401)
  const id = Number(c.req.param('id'))
  if (!Number.isSafeInteger(id) || id <= 0) return c.json({ error: 'Invalid ID' }, 400)
  const db = drizzle(c.env.DB)
  const [owned] = await db.select({ id: bookmarks.id }).from(bookmarks)
    .innerJoin(categories, eq(bookmarks.categoryId, categories.id))
    .where(and(eq(bookmarks.id, id), eq(categories.userId, person.id)))
  if (!owned) return c.json({ error: 'Not found' }, 404)
  await db.delete(bookmarks).where(eq(bookmarks.id, id))
  return c.body(null, 204)
})

export default app

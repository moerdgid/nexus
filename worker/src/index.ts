
import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { sql } from 'drizzle-orm'
import { asc } from 'drizzle-orm'
import { categories, bookmarks } from './db/schema'
import { eq } from 'drizzle-orm'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/api/status', async (c) => {
  const db = drizzle(c.env.DB)

  const result = await db.get<{ value: number }>(
    sql`SELECT 1 AS value`
  )

  return c.json({
    application: 'Nexus',
    status: 'online',
    database: result?.value === 1 ? 'connected' : 'error'
  })
})

app.get('/api/categories', async (c) => {
  const db = drizzle(c.env.DB)

  const result = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.displayOrder))

  return c.json(result)
})


app.get('/api/links', async (c) => {
  const db = drizzle(c.env.DB)

  // Temporary development user until authentication is implemented
  const userId = 'dev-user-1'

  const userCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.displayOrder))

  const result = await Promise.all(
    userCategories.map(async (category) => {
      const links = await db
        .select({
          id: bookmarks.id,
          title: bookmarks.title,
          url: bookmarks.url,
          icon: bookmarks.icon,
          displayOrder: bookmarks.displayOrder
        })
        .from(bookmarks)
        .where(eq(bookmarks.categoryId, category.id))
        .orderBy(asc(bookmarks.displayOrder))

      return {
        id: category.id,
        name: category.name,
        displayOrder: category.displayOrder,
        links
      }
    })
  )

  return c.json(result)
})


export default app

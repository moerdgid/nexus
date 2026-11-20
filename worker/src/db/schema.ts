
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'



export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
})



export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  displayOrder: integer('display_order').notNull().default(0)
})


export const bookmarks = sqliteTable('bookmarks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id')
    .notNull()
    .references(() => categories.id),
  title: text('title').notNull(),
  url: text('url').notNull(),
  icon: text('icon').notNull().default('link'),
  displayOrder: integer('display_order').notNull().default(0)
})

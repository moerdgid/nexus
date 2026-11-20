
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/d1'

export function createAuth(database: D1Database) {
  const db = drizzle(database)

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'sqlite'
    }),
    emailAndPassword: {
      enabled: true
    }
  })
}

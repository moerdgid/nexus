import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/d1'
import * as authSchema from './db/auth-schema'

export type Env = {
  DB: D1Database
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL?: string
  ALLOW_SIGNUP?: string
  ADMIN_EMAIL?: string
}

export function createAuth(env: Env, origin: string) {
  if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must be set to at least 32 characters')
  }
  const db = drizzle(env.DB, { schema: authSchema })
  return betterAuth({
    baseURL: env.BETTER_AUTH_URL || origin,
    basePath: '/api/auth',
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [origin, ...(env.BETTER_AUTH_URL ? [env.BETTER_AUTH_URL] : [])],
    database: drizzleAdapter(db, { provider: 'sqlite', schema: authSchema }),
    emailAndPassword: { enabled: true, disableSignUp: env.ALLOW_SIGNUP !== 'true' },
  })
}

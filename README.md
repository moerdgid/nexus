# Nexus

A personal dashboard hosted on **one Cloudflare Worker**. React/Vite is in `frontend/`; Hono, Better Auth, Drizzle and D1 are in `worker/`. One Git repository, one Cloudflare deployment, one domain. The previous ASP.NET Core backend is no longer included.

## Local setup (PowerShell, repository root)

1. `npm install`
2. `npm run setup`
3. Copy `.dev.vars.example` to `.dev.vars`, replace the secret, URL and admin email. Generate a secret with `[Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))`.
4. `npm run db:local`
5. `npm run dev`
6. Open http://localhost:5173 (Vite forwards `/api` to the Worker on port 8787).

For a local test account, set `ALLOW_SIGNUP="true"` in `.dev.vars`, then use PowerShell:

```powershell
$body = @{ name = 'Gideon'; email = 'you@example.com'; password = 'a-long-unique-password' } | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:5173/api/auth/sign-up/email' -Method Post -ContentType 'application/json' -Body $body
```

Sign in using the Nexus UI. After creating initial accounts, set `ALLOW_SIGNUP="false"` and restart `npm run dev`. The old `dev@nexus.local` D1 row is not a login account.

## Verify and deploy

- `npm run typecheck` checks Worker types and builds React.
- `npm run build` creates `frontend/dist` for the Worker to serve.
- `npm run db:remote` applies migrations to remote D1. **Review migrations first**.
- Set production secrets with `npx wrangler secret put BETTER_AUTH_SECRET`.
- Set production `BETTER_AUTH_URL` to `https://nexus.moerdyk.dev` and keep `ALLOW_SIGNUP` disabled using Worker environment variables in `wrangler.jsonc` (do not put secrets there).
- `npm run deploy` builds and deploys a **single Worker with static assets**. Connect `nexus.moerdyk.dev` to that Worker in Cloudflare when ready.

The existing D1 database ID is retained from the supplied archive. `wrangler.jsonc` lives at the repository root, so Wrangler's local D1 state may start fresh; applying the migrations recreates local tables. Local data from an older `worker/.wrangler/` directory is not automatically carried over.

**Not verified:** Dependency installation, builds, browser login and deployment must be tested on your machine. Keep the original ZIP as a backup. This does not change any live Cloudflare DNS, Google Cloud VM, or wedding website.

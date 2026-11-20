# Nexus

Nexus is a personal dashboard for organizing bookmarks, projects, and frequently used services in one place.

It's part of my larger Fulcrum environment, which I'm building to experiment with web development, cloud infrastructure, and different technologies as I learn.

The goal is to keep Nexus simple, customizable, and useful as an everyday homepage.

## Features

- Personal dashboard with light and dark themes
- Custom bookmark categories and links
- User accounts with private bookmarks
- Persistent storage using Cloudflare D1
- Responsive interface for desktop and mobile

## Tech Stack

| | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | TypeScript, Hono |
| Authentication | Better Auth |
| Database | Cloudflare D1, Drizzle ORM |
| Hosting | Cloudflare Workers |
| Version Control | GitHub |

## Project Structure

```text
nexus/
├── frontend/       # React application
├── worker/         # API, authentication, and database
├── wrangler.jsonc  # Cloudflare configuration
└── package.json    # Development scripts
```

## Local Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/moerdgid/nexus.git
cd nexus

npm install
npm install --prefix frontend
npm install --prefix worker
```

Create a `.dev.vars` file in the project root with the local authentication settings:

```dotenv
BETTER_AUTH_SECRET="your-secret"
BETTER_AUTH_URL="http://localhost:5173"
ALLOW_SIGNUP="false"
ADMIN_EMAIL="your-email@example.com"
```

The local database also needs its migrations applied:

```bash
npx wrangler d1 migrations apply nexus-db --local
```

Start the development servers:

```bash
npm run dev
```

The frontend runs at `http://localhost:5173`, with the API running through Wrangler on port `8787`.

## Deployment

Nexus is hosted on Cloudflare Workers at **https://nexus.moerdyk.dev**.

The GitHub repository is connected to Cloudflare. Pushing changes to `main` automatically triggers a new build and deployment.

```bash
git add .
git commit -m "Update Nexus"
git push
```

Production environment variables and authentication secrets are managed through Cloudflare.

## Fulcrum

Fulcrum is my broader personal development environment. Nexus is one of the applications within it, serving as a central place to access the tools and services I use.

The project is ongoing, with new features and improvements added as needed.
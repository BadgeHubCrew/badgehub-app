# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev              # Start both frontend (Vite :5173) and backend (:8081) concurrently
npm run test-db:up       # Start PostgreSQL test DB via Docker
npm run test-db:down     # Stop test DB
npm run repopulate-db    # Load mock data into test DB
```

### Build & Validate
```bash
npm run build            # Build all workspaces
npm run check:ts         # TypeScript type checking across all packages
npm run lint             # Prettier formatting check
npm run validate         # Full validation: lint + check:ts + build + test
```

### Testing
```bash
npm run test                                          # All tests across workspaces
npm run test --workspace=packages/frontend            # Frontend tests only
npm run test --workspace=packages/backend             # Backend tests only
npx vitest run src/path/to/file.test.ts               # Single test file (run from package dir)
npx vitest run --reporter=verbose                     # Verbose output
```

### Database Migrations
```bash
npm run db-migrate:up    # Run pending migrations
npm run db-migrate:down  # Rollback last migration
npm run db-migrate:create -- migration-name  # Create new migration
```

### Code Quality
```bash
npx prettier --write .   # Auto-fix formatting
```

## Architecture

### Monorepo Structure
- `packages/frontend` — React 19 + Vite + Tailwind CSS v4 + DaisyUI v5
- `packages/backend` — Express + PostgreSQL REST API
- `packages/shared` — Shared TypeScript types, Zod schemas, and **ts-rest API contracts**

The key architectural pattern is **ts-rest**: API contracts are defined once in `packages/shared/src/contracts/` and consumed by both frontend (as typed API client) and backend (as route definitions). This ensures end-to-end type safety without code generation.

### Frontend Dev Mode (Important)
The frontend dev script copies `index-indirect-dev.html` → `dist/index.html` before starting Vite. The backend serves `dist/index.html` (not the Vite dev server directly). This indirect HTML loads Vite assets dynamically via `@vite/client`, allowing the backend URL to serve the app in development.

**Do not add CDN links for Tailwind or DaisyUI** to `index-indirect-dev.html` — Vite injects CSS from `src/index.css` automatically.

### CSS / Styling
- Tailwind CSS v4 uses `@tailwindcss/vite` plugin in `vite.config.ts` (NOT `@tailwindcss/postcss`)
- `postcss.config.js` must remain empty (`export default {}`)
- CSS entry: `packages/frontend/src/index.css` with `@import "tailwindcss"` and `@plugin "daisyui"`
- DaisyUI themes configured: light, dark, dracula, synthwave, cyberpunk, nord, forest, aqua, luxury, coffee

### Authentication
Keycloak + JWT. The frontend uses `keycloak-js` wrapped in a `SessionProvider`. The backend validates JWTs via the `jose` library. Local Keycloak config lives in `infra/keycloak/`.

### Database
PostgreSQL with `db-migrate` for migrations. Migration files are in `packages/backend/src/db/migrations/`. SQL queries use `sql-template-tag` for tagged template literals.

### API Documentation
Swagger UI is served by the backend at runtime, generated from ts-rest contracts via `@ts-rest/open-api`.

### Production
Docker + PM2. The `Dockerfile` is multi-stage; the backend serves the built frontend static assets. Deployed via GitHub Actions on push to `main`.

## Commit Convention
Follow [Conventional Commits](https://www.conventionalcommits.org/) with these types:
`build`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `style`, `test`, `devex`, `clean`, `chore`, `revert`, `wip`, `deps`, `types`, `config`, `claude`

## Node Version
It's Node 24.4.1 but should already be correctly set up in the environment. If not, ask the user to fix it.
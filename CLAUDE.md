# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
pnpm run dev              # Start both frontend (Vite :5173) and backend (:8081) concurrently
pnpm run test-db:up       # Start PostgreSQL test DB via Docker
pnpm run test-db:down     # Stop test DB
pnpm run repopulate-db    # Load mock data into test DB
```

### Build & Validate
```bash
pnpm run build            # Build all workspaces
pnpm run check:ts         # TypeScript type checking across all packages
pnpm run lint             # Biome format + lint check
pnpm run lint:fix         # Biome auto-fix format + safe lint fixes
pnpm run check:deps       # pnpm peers check (run after changing deps)
pnpm run validate         # Full validation: lint + check:ts + build + test
# CI: .github/workflows/deps.yml runs peers + deprecation checks when pnpm-lock.yaml changes
```

### Testing
```bash
pnpm run test                                          # All tests across workspaces
pnpm --filter frontend test                            # Frontend tests only
pnpm --filter badgehub-api test                        # Backend tests only
pnpm --filter frontend exec vitest run src/path/to/file.test.ts   # Single test file
pnpm --filter frontend exec vitest run --reporter=verbose         # Verbose output from frontend package
# Or cd packages/frontend && pnpm exec vitest run ... (from package dir)
```

### Database Migrations
```bash
pnpm --filter badgehub-api run db-migrate:up    # Run pending migrations
pnpm --filter badgehub-api run db-migrate:down  # Rollback last migration
pnpm --filter badgehub-api run db-migrate:create -- migration-name  # Create new migration
```

### Code Quality
```bash
pnpm run lint:fix           # Auto-fix with Biome (format + safe lint fixes)
# Git hooks: lefthook runs biome on staged files at pre-commit
# Config: biome.json (formatter + recommended linter rules)
```

## Architecture

### Monorepo Structure
- `packages/frontend` — React 19 + Vite + Tailwind CSS v4 + DaisyUI v5
- `packages/backend` — Express + PostgreSQL REST API
- `packages/shared` — Shared TypeScript types, Zod v4 schemas, and **oRPC API contracts**

The key architectural pattern is **oRPC + Zod v4**: API contracts live in `packages/shared/src/contracts/` and are implemented on the backend with `OpenAPIHandler` and consumed on the frontend via `OpenAPILink`. OpenAPI/Swagger is generated from the same contracts (`@orpc/openapi` + `@orpc/zod/zod4`).

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
Swagger UI is served by the backend at runtime, generated from oRPC contracts via `@orpc/openapi` + `@orpc/zod/zod4`.

### Production
Docker + PM2. The `Dockerfile` is multi-stage; the backend serves the built frontend static assets. Deployed via GitHub Actions on push to `main`.

## Commit Convention
Follow [Conventional Commits](https://www.conventionalcommits.org/) with these types:
`build`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `style`, `test`, `devex`, `clean`, `chore`, `revert`, `wip`, `deps`, `types`, `config`, `claude`

## Node Version
It's Node 24.4.1 but should already be correctly set up in the environment. If not, ask the user to fix it.
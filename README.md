
[<img src="assets/badgehub-logo.svg" align="right" alt="BadgeHub logo" width="200">](#readme) 
# BadgeHub App: API and Frontend Code for BadgeHub

> Monorepo with both Node.js REST API and React frontend
## Authentication
BadgeHub supports authentication via JWT. This is used with Keycloak. To setup Keycloak for either production or local development and related clients, please refer to [badgehub-infra GitHub repo](https://github.com/BadgeHubCrew/badgehub-infra/tree/main/docs)

## - Development -
### Install

Make sure [Docker](https://www.docker.com/get-started/) is installed and running.

Before running, copy the `.env.example` into `.env`

```bash
cp .env.example .env
```

and fill out the details.

### Running locally
The most convenient way to run BadgeHub locally is this way:
- configure the `.env` file to use the dev keycloak server, like it is done in the `.env.example` file.
- start the test database with docker: `npm run test-db:up`
- if this is your first time running BadgeHub, or the populate db script was updated, you should also do:
  ```bash
  npm run --workspace=packages/backend repopulate-db
  ```
- start the frontend and backend with this command: `npm run dev`

### Database Migrations

In order to make sure that we can keep track of the database schema, we use [db-migrate](https://db-migrate.readthedocs.io/en/latest/).
This allows us to track the database changes along with git and provide a framework for migrating data and rolling back changes.
So when a change to the database schema is needed, a new migration should be created instead of manually changing the database.
To create a new migration, follow the steps below.

#### Create a new migration

```bash
npm run --workspace=packages/backend db-migrate:create -- <migration-name>
```

This will create a new migration file in the `migrations` directory with the name `<timestamp>-<migration-name>.js` as well as 2 sql files, one for the up migration and one for the down migration.

#### Fill in the down and up migration sql files with the necessary changes to the database schema.

These sql commands should take care of changing the database schema as well as migrating the data if necessary.

#### Run the migration to test it.

```bash
npm run --workspace=packages/backend db-migrate:up
```

#### Run the down migration to test it.

```bash
npm run --workspace=packages/backend db-migrate:down
```

#### Commit the migration files to git.

When the code is deployed, the up migrations will be run automatically before starting the server.

### Testing
The unit test require the test database to be up and filled in.
So first do:
`npm run test-db:up`

And if this is the very first time, or the populate db script was updated, you should also do:
`npm run --workspace=packages/backend repopulate-db`

Then to run the tests, do:
`npm run test`
 
## - Production -

In production, use the production docker compose file `docker-compose.production.yml`.
The `NODE_ENV` environment file is set to `production`, and there's no watcher.

The first time, a Docker container is created. Make sure the `dist` directory
contains the latest build to be copied to the container.
Also the `public` directory and `package.json` and `package-lock.json` will
be copied.

To start:

```bash
docker compose --file docker-compose.production.yml up --detach
```

Then visit [http://localhost:9001/](http://localhost:9001/) for the production BadgeHub homepage
and [http://localhost:9002/](http://localhost:9002/) for PG_Admin, the UI for the database.

To wind down:

```bash
docker compose --file docker-compose.production.yml down
```
### Infra repo
The docker compose files used for running BadgeHub in production are maintained in the [badgehub-infra GitHub repo](https://github.com/badgehubcrew/badgehub-infra)


## Tools used

- [Express](https://expressjs.com/), a framework for Node.js
- [pnpm](https://pnpm.io/) for package management
- [ts-rest](https://ts-rest.com/) for a type safe http controller, contract and client without code generation
- [zod](https://github.com/colinhacks/zod) for defining and checking json schemas
- [sql-template-tag](https://github.com/blakeembrey/sql-template-tag) for more easily writing SQL queries
- [tsx](https://tsx.is/) for running TypeScript files in Node.js
- [db-migrate](https://db-migrate.readthedocs.io/en/latest/) for database migrations

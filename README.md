# BadgeHub API and Frontend

> Node.js REST service for the BadgeHub

## Development
## Install

Make sure [Docker](https://www.docker.com/get-started/) is installed and running.

Before running, copy the `.env.example` into `.env`

```bash
cp .env.example .env
```

and fill out the details.

## Run

Then start the Docker containers by typing

```bash
docker compose up --detach
```

Then visit [http://localhost:8001/](http://localhost:8001/) for the development BadgeHub homepage.

Visit [http://localhost:8002/](http://localhost:8002/) for the pgAdmin interface.
Use password `badgehub` to connect to the BadgeHub database server.

Use the [OpenAPI (Swagger) documentation](/openapi) to interact with the REST API.

## Authentication

BadgeHub supports authentication via JWT. This is used with Keycloak. To setup Keycloak for either production or local development and related clients, please refer to [badgehub-infra GitHub repo](https://github.com/BadgeHubCrew/badgehub-infra/tree/main/docs)

## Development

After setting up the development container, you can start it with

```bash
docker compose up --detach
```

The API should now be accessible through `localhost:8001`.

And to stop BadgeHub

```bash
docker compose down
```

Or, to stop BadgeHub and delete all volumes (to start fresh)

```bash
docker compose down --volumes
```

### Database Migrations

In order to make sure that we can keep track of the database schema, we use [db-migrate](https://db-migrate.readthedocs.io/en/latest/).
This allows us to track the database changes along with git and provide a framework for migrating data and rolling back changes.
So when a change to the database schema is needed, a new migration should be created instead of manually changing the database.
To create a new migration, follow the steps below.

#### Create a new migration

```bash
npm run db-migrate:create -- <migration-name>
```

This will create a new migration file in the `migrations` directory with the name `<timestamp>-<migration-name>.js` as well as 2 sql files, one for the up migration and one for the down migration.

#### Fill in the down and up migration sql files with the necessary changes to the database schema.

These sql commands should take care of changing the database schema as well as migrating the data if necessary.

#### Run the migration to test it.

```bash
npm run db-migrate:up
```

#### Create updated mockup-data.sql

For the mock data, we always want up to date tables.
So if you change something to the database, you should also update the population script and then you should run it from the server:

```bash
curl -X POST http://localhost:8081/dev/populate
```

This script will also automatically update the `mockup-data.sql` file after completion.
Note that this `mockup-data.sql` is not completely deterministic, so it might not be the same every time you run it.
The actual table data should be deterministic though, it's just that the dumping can decide to dump the data in a slightly different order.
To keep the determinism of the actual table content after repopulation, we do the following:

- we reset the primary key sequence for each table after clearing the table at the start of the script
- we use mock dates for the `created_at` and `updated_at` fields, so that the dates don't change when running the population script twice.
-

#### Run the down migration to test it.

```bash
npm run db-migrate:down
```

#### Commit the migration files to git.

When the code is deployed, the up migrations will be run automatically before starting the server.

### Applying commands to only 1 container from the compose file

Container commands like `stop`, `start`, `restart` and `logs` can also be sent to one of the containers from the compose file. For example

```bash
docker compose restart node
```

will restart the node container only.

## Database schema

At the moment, this is the database schema:

[BadgeHub Schema](https://drawsql.app/teams/badge-team/diagrams/simplified-database)

## - Production -

In production, use the production docker compose file `docker-compose.production.yml`.
The `NODE_ENV` environment file is set to `production`, there's no watcher and
PM2 is used to run Node.js multithreaded.

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

## Tools used

- [Express](https://expressjs.com/), a framework for Node.js
- [pnpm](https://pnpm.io/) for package management
- [ts-rest](https://ts-rest.com/) for a type safe http controller, contract and client without code generation
- [zod](https://github.com/colinhacks/zod) for defining and checking json schemas
- [sql-template-tag](https://github.com/blakeembrey/sql-template-tag) for more easily writing SQL queries
- [tsx](https://tsx.is/) for running TypeScript files in Node.js
- [db-migrate](https://db-migrate.readthedocs.io/en/latest/) for database migrations
- [PM2](https://pm2.keymetrics.io/) for managing Node.js processes

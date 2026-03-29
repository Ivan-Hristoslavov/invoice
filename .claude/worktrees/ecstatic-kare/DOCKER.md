# Docker Setup for InvoiceNinja

This guide explains how to use Docker to set up the PostgreSQL database for the InvoiceNinja invoicing system.

## Prerequisites

- Docker installed on your system
- Docker Compose installed on your system

## Running PostgreSQL with Docker

1. Start the PostgreSQL container:

```bash
docker-compose up -d
```

This will start a PostgreSQL server with the following configuration:
- Username: root
- Password: mysecretpassword
- Database: postgres
- Schema: invoice
- Port: 5433 (mapped from standard port 5432)

2. Run the database setup script:

```bash
node scripts/setup-db-env.js
```

This will create a `.env` file with the correct database configuration.

3. Apply the Prisma schema to the database:

```bash
npx prisma db push
```

4. Generate the Prisma client:

```bash
npx prisma generate
```

5. Seed the database with initial data:

```bash
npx prisma db seed
```

## Managing Database Data

You can use Prisma Studio to view and edit your database:

```bash
npx prisma studio
```

This will open a web interface at http://localhost:5555 where you can browse and manage your data.

## Stopping the Database

To stop the PostgreSQL container:

```bash
docker-compose down
```

To remove all data volumes and completely reset the database:

```bash
docker-compose down -v
```

## Connection Information

- Host: localhost
- Port: 5433
- Username: root
- Password: mysecretpassword
- Database: postgres
- Schema: invoice
- Connection URL: postgresql://root:mysecretpassword@localhost:5433/postgres?schema=invoice 
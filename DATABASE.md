# InvoiceNinja Database Setup

This document explains how to set up and manage the database for the InvoiceNinja application.

## Prerequisites

- Docker and Docker Compose installed on your system
- Node.js and npm installed

## Database Configuration

The application uses PostgreSQL as the database. The database connection is configured using environment variables:

```
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_SCHEMA=invoice
DB=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/postgres?schema=invoice
```

## Setup and Management

### Quick Setup

The easiest way to set up the database is using our setup script:

```bash
./scripts/db-setup.sh
```

This script will:
1. Create a `.env` file with the correct database configuration
2. Start a PostgreSQL container using Docker Compose
3. Test the database connection
4. Apply the Prisma schema to the database
5. Generate the Prisma client

### Manual Setup

Alternatively, you can set up the database manually:

1. **Create Environment Variables**:
   ```bash
   node scripts/setup-db-env.js
   ```

2. **Start the Database**:
   ```bash
   docker-compose up -d postgres
   ```

3. **Apply the Schema**:
   ```bash
   npx prisma db push
   ```

4. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

5. **Seed the Database**:
   ```bash
   npm run db:seed
   ```

## Testing the Connection

You can test the database connection in several ways:

1. **Direct Test Script**:
   ```bash
   node scripts/direct-db-test.js
   ```

2. **Prisma Studio**:
   ```bash
   npx prisma studio
   ```
   This opens a web interface at http://localhost:5555 where you can browse and manage your data.

3. **API Endpoint**:
   With the application running, visit:
   ```
   http://localhost:3000/api/db-test
   ```

## Sample Data

The database is seeded with sample data for demonstration purposes:

- **Demo User**: demo@example.com / password123
- **Sample Company**: InvoiceNinja Demo Company
- **Sample Clients**: Acme Corporation, Wayne Enterprises, Stark Industries
- **Sample Products**: Web Development, Logo Design, SEO Consulting, Domain Registration
- **Sample Invoices**: Various invoices with different statuses (PAID, UNPAID, OVERDUE)

## Troubleshooting

If you encounter issues with the database connection:

1. **Check if PostgreSQL is running**:
   ```bash
   docker ps
   ```

2. **Check the logs**:
   ```bash
   docker logs rapidframe-postgres-1
   ```

3. **Verify environment variables**:
   ```bash
   cat .env
   ```

4. **Test direct connection**:
   ```bash
   node scripts/test-db-connection.js
   ```

5. **Reset the database**:
   ```bash
   docker-compose down -v
   docker-compose up -d postgres
   npx prisma db push
   npm run db:seed
   ``` 
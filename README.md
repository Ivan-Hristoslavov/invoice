# InvoiceNinja

A Next.js application for creating and managing invoices.

## Features

- 🧾 Invoice management with multi-currency support
- 👥 Client management
- 🏢 Company profile management
- 📊 Dashboard with key metrics
- 📝 Product catalog
- 🔒 Authentication and user management
- 📱 Responsive design for all devices

## Database Setup

The application uses PostgreSQL as the database. Follow these steps to set up the database:

1. Make sure you have PostgreSQL installed and running on your system
2. Set up your environment variables:

```bash
npm run db:setup
```

This will create a `.env` file with the following configuration:

```
DB_CLIENT=postgres
DB_HOST=localhost
DB_SCHEMA=invoice
DB_PORT=5432
DB_USERNAME=root
DB_PASSWORD=mysecretpassword
DB=postgres

# Prisma database URL
DATABASE_URL="postgresql://root:mysecretpassword@localhost:5432/postgres?schema=invoice"
```

3. Create the database schema:

```bash
npm run db:push
```

4. Populate the database with sample data:

```bash
npm run db:seed
```

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Data Models

The system includes the following data models:

- **User**: Authentication and user data
- **Company**: Company information for invoice issuer
- **Client**: Client information
- **Product**: Product catalog
- **Invoice**: Complete invoice with metadata, items, and payments
- **InvoiceItem**: Line items within invoices
- **Payment**: Payments associated with invoices

## Seed Data

The seed script creates a demo account with sample data:

- **Email**: demo@example.com
- **Password**: password123

It also creates sample companies, clients, products and invoices.

## Database Tools

- `npm run db:studio` - Open Prisma Studio to manage data
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to the database

## Environment Variables

Required environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth
- `NEXTAUTH_URL`: URL for NextAuth
- `NEXT_PUBLIC_APP_URL`: Public URL of the application

## License

MIT

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
"# InvoiceNinja" 

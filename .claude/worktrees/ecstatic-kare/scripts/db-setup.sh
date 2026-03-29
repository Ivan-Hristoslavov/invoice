#!/bin/bash
set -e

# Print header
echo "======================================"
echo "InvoiceNinja Database Setup"
echo "======================================"
echo

# Setup environment variables
echo "🔧 Setting up environment variables..."
node scripts/setup-db-env.js
echo

# Start the database container
echo "🐘 Starting PostgreSQL database container..."
docker-compose up -d postgres
echo

# Wait for the database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5
echo

# Test the database connection
echo "🧪 Testing database connection..."
node scripts/test-db-connection.js
echo

# Apply database schema
echo "📊 Applying database schema..."
npx prisma db push
echo

# Generate Prisma client
echo "🔄 Generating Prisma client..."
npx prisma generate
echo

# Summary
echo "✅ Database setup completed successfully!"
echo "You can now run your application with: npm run dev"
echo
echo "To open Prisma Studio and manage your data:"
echo "npx prisma studio"
echo
echo "======================================" 
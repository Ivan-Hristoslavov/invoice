#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// App name
const APP_NAME = "InvoiceNinja";

// Default configuration values
const defaults = {
  PORT: 3000,
  NODE_ENV: 'development',
  DB_HOST: 'localhost',
  DB_PORT: 5433,
  DB_USERNAME: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_SCHEMA: 'invoice',
  DB: 'postgres',
  NEXTAUTH_SECRET: 'your-secret-key-for-jwt',
};

function generateEnvFile() {
  console.log(`Setting up ${APP_NAME} environment variables...`);
  
  // Construct the DATABASE_URL
  const databaseUrl = `postgresql://${defaults.DB_USERNAME}:${defaults.DB_PASSWORD}@${defaults.DB_HOST}:${defaults.DB_PORT}/${defaults.DB}?schema=${defaults.DB_SCHEMA}`;
  
  // Create environment variables content
  const envContent = `# Application settings
PORT=${defaults.PORT}
NODE_ENV=${defaults.NODE_ENV}

# Database settings
DB_HOST=${defaults.DB_HOST}
DB_PORT=${defaults.DB_PORT}
DB_USERNAME=${defaults.DB_USERNAME}
DB_PASSWORD=${defaults.DB_PASSWORD}
DB_SCHEMA=${defaults.DB_SCHEMA}
DB=${defaults.DB}

# Prisma database URL
DATABASE_URL="${databaseUrl}"

# Authentication
NEXTAUTH_SECRET="${defaults.NEXTAUTH_SECRET}"
NEXTAUTH_URL="http://localhost:${defaults.PORT}"
NEXT_PUBLIC_APP_URL="http://localhost:${defaults.PORT}"
`;

  // Write the content to the .env file
  const envPath = path.join(__dirname, '..', '.env');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Environment variables have been set up successfully!`);
    console.log(`Environment file created at: ${envPath}`);
    console.log(`\nDatabase connection URL:\n${databaseUrl}`);
    console.log(`\nYou can now start your database with: docker-compose up -d postgres`);
    console.log(`And test the connection with: node scripts/test-db-connection.js`);
  } catch (error) {
    console.error('❌ Failed to create .env file:');
    console.error(error);
    process.exit(1);
  }
}

// Run the setup
generateEnvFile(); 
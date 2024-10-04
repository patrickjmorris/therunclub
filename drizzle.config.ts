import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env' });

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: isProduction
    ? {
        url: process.env.LOCAL_DB_URL!,
      }
    : {
        url: process.env.LOCAL_DB_URL!,
      },
});

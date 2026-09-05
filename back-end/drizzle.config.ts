import { defineConfig } from 'drizzle-kit';
import * as schema from './src/db/schema';

export default defineConfig({
  schema: schema,
  out: './migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/smk24.db',
  },
  verbose: true,
  strict: true,
});

import 'dotenv/config';
import { readFileSync } from 'fs';
import { Pool } from '@neondatabase/serverless';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const migration = readFileSync('scripts/expand-catalog-settings.sql', 'utf-8');

  console.log('🔄 Expanding catalog_settings table...');
  await pool.query(migration);
  console.log('✅ catalog_settings expanded successfully!');
  await pool.end();
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});

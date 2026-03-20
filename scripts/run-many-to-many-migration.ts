import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('Running many-to-many migration...\n');

  // Step 1: Create catalog_products join table
  console.log('1. Creating catalog_products table...');
  await sql`
    CREATE TABLE IF NOT EXISTS "catalog_products" (
      "catalog_id" text NOT NULL REFERENCES "catalogs"("id") ON DELETE CASCADE,
      "product_id" text NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
      "sort_order" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "catalog_products_catalog_id_product_id_pk" PRIMARY KEY("catalog_id","product_id")
    )
  `;

  // Step 2: Add business_id columns (nullable for now)
  console.log('2. Adding business_id to products...');
  await sql`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "business_id" text`;

  console.log('3. Adding business_id to categories...');
  await sql`ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "business_id" text`;

  // Step 3: Populate business_id from existing catalog relationships
  console.log('4. Populating products.business_id from catalogs...');
  const prodUpdated = await sql`
    UPDATE "products" p
    SET "business_id" = c."business_id"
    FROM "catalogs" c
    WHERE p."catalog_id" = c."id"
      AND p."business_id" IS NULL
  `;
  console.log(`   Updated ${prodUpdated.length || 0} products`);

  console.log('5. Populating categories.business_id from catalogs...');
  const catUpdated = await sql`
    UPDATE "categories" cat
    SET "business_id" = c."business_id"
    FROM "catalogs" c
    WHERE cat."catalog_id" = c."id"
      AND cat."business_id" IS NULL
  `;
  console.log(`   Updated ${catUpdated.length || 0} categories`);

  // Step 4: Populate catalog_products from existing products.catalog_id
  console.log('6. Populating catalog_products from existing relationships...');
  const linksInserted = await sql`
    INSERT INTO "catalog_products" ("catalog_id", "product_id", "sort_order")
    SELECT p."catalog_id", p."id", COALESCE(p."sort_order", 0)
    FROM "products" p
    WHERE p."catalog_id" IS NOT NULL
    ON CONFLICT DO NOTHING
  `;
  console.log(`   Inserted ${linksInserted.length || 0} catalog-product links`);

  // Step 5: Set business_id NOT NULL
  console.log('7. Setting products.business_id to NOT NULL...');
  await sql`ALTER TABLE "products" ALTER COLUMN "business_id" SET NOT NULL`;

  console.log('8. Setting categories.business_id to NOT NULL...');
  await sql`ALTER TABLE "categories" ALTER COLUMN "business_id" SET NOT NULL`;

  // Step 6: Add FK constraints if not exist
  console.log('9. Adding FK constraints...');
  try {
    await sql`ALTER TABLE "products" ADD CONSTRAINT "products_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE`;
  } catch {
    console.log('   products FK already exists, skipping');
  }

  try {
    await sql`ALTER TABLE "categories" ADD CONSTRAINT "categories_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE`;
  } catch {
    console.log('   categories FK already exists, skipping');
  }

  // Step 7: Make catalog_id nullable
  console.log('10. Making catalog_id nullable...');
  try {
    await sql`ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_catalog_id_catalogs_id_fk"`;
    await sql`ALTER TABLE "products" ALTER COLUMN "catalog_id" DROP NOT NULL`;
    await sql`ALTER TABLE "products" ADD CONSTRAINT "products_catalog_id_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "catalogs"("id") ON DELETE SET NULL`;
  } catch (e) {
    console.log('   products catalog_id:', (e as Error).message);
  }

  try {
    await sql`ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_catalog_id_catalogs_id_fk"`;
    await sql`ALTER TABLE "categories" ALTER COLUMN "catalog_id" DROP NOT NULL`;
    await sql`ALTER TABLE "categories" ADD CONSTRAINT "categories_catalog_id_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "catalogs"("id") ON DELETE SET NULL`;
  } catch (e) {
    console.log('   categories catalog_id:', (e as Error).message);
  }

  console.log('\n✅ Migration completed successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

-- ============================================================
-- Migration: Products & Categories Many-to-Many with Catalogs
-- ============================================================
-- This migration:
-- 1. Adds business_id to products and categories
-- 2. Creates catalog_products join table
-- 3. Migrates existing data
-- 4. Makes catalog_id nullable on products and categories
-- ============================================================

-- Step 1: Create catalog_products join table
CREATE TABLE IF NOT EXISTS "catalog_products" (
  "catalog_id" text NOT NULL REFERENCES "catalogs"("id") ON DELETE CASCADE,
  "product_id" text NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "catalog_products_catalog_id_product_id_pk" PRIMARY KEY("catalog_id","product_id")
);

-- Step 2: Add business_id to products (nullable first for migration)
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "business_id" text;

-- Step 3: Add business_id to categories (nullable first for migration)
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "business_id" text;

-- Step 4: Populate products.business_id from existing catalog relationship
UPDATE "products" p
SET "business_id" = c."business_id"
FROM "catalogs" c
WHERE p."catalog_id" = c."id"
  AND p."business_id" IS NULL;

-- Step 5: Populate categories.business_id from existing catalog relationship
UPDATE "categories" cat
SET "business_id" = c."business_id"
FROM "catalogs" c
WHERE cat."catalog_id" = c."id"
  AND cat."business_id" IS NULL;

-- Step 6: Populate catalog_products from existing products.catalog_id
INSERT INTO "catalog_products" ("catalog_id", "product_id", "sort_order")
SELECT p."catalog_id", p."id", p."sort_order"
FROM "products" p
WHERE p."catalog_id" IS NOT NULL
ON CONFLICT DO NOTHING;

-- Step 7: Make business_id NOT NULL on products
ALTER TABLE "products" ALTER COLUMN "business_id" SET NOT NULL;

-- Step 8: Make business_id NOT NULL on categories
ALTER TABLE "categories" ALTER COLUMN "business_id" SET NOT NULL;

-- Step 9: Add foreign key constraints for business_id
ALTER TABLE "products" ADD CONSTRAINT "products_business_id_businesses_id_fk"
  FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;

ALTER TABLE "categories" ADD CONSTRAINT "categories_business_id_businesses_id_fk"
  FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;

-- Step 10: Make catalog_id nullable on products (drop old FK, re-add as nullable)
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_catalog_id_catalogs_id_fk";
ALTER TABLE "products" ALTER COLUMN "catalog_id" DROP NOT NULL;
ALTER TABLE "products" ADD CONSTRAINT "products_catalog_id_catalogs_id_fk"
  FOREIGN KEY ("catalog_id") REFERENCES "catalogs"("id") ON DELETE SET NULL;

-- Step 11: Make catalog_id nullable on categories (drop old FK, re-add as nullable)
ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_catalog_id_catalogs_id_fk";
ALTER TABLE "categories" ALTER COLUMN "catalog_id" DROP NOT NULL;
ALTER TABLE "categories" ADD CONSTRAINT "categories_catalog_id_catalogs_id_fk"
  FOREIGN KEY ("catalog_id") REFERENCES "catalogs"("id") ON DELETE SET NULL;

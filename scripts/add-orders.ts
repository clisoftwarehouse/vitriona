import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('Creating orders and order_items tables...');

  await sql`
    CREATE TABLE IF NOT EXISTS "orders" (
      "id" text PRIMARY KEY NOT NULL,
      "business_id" text NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
      "catalog_id" text NOT NULL REFERENCES "catalogs"("id") ON DELETE CASCADE,
      "order_number" text NOT NULL,
      "customer_name" text NOT NULL,
      "customer_phone" text,
      "customer_email" text,
      "customer_notes" text,
      "subtotal" numeric(10, 2) DEFAULT '0' NOT NULL,
      "total" numeric(10, 2) DEFAULT '0' NOT NULL,
      "status" text DEFAULT 'pending' NOT NULL,
      "checkout_type" text DEFAULT 'whatsapp' NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "order_items" (
      "id" text PRIMARY KEY NOT NULL,
      "order_id" text NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
      "product_id" text REFERENCES "products"("id") ON DELETE SET NULL,
      "product_name" text NOT NULL,
      "unit_price" numeric(10, 2) NOT NULL,
      "quantity" integer DEFAULT 1 NOT NULL,
      "subtotal" numeric(10, 2) NOT NULL
    )
  `;

  console.log('Done! Tables created successfully.');
}

main().catch(console.error);

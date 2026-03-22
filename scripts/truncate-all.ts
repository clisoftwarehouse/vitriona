import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function main() {
  const { sql } = await import('drizzle-orm');
  const { db } = await import('../src/db/drizzle');

  await db.execute(sql`TRUNCATE
    users, user_preferences, accounts, sessions, verification_tokens, authenticators,
    businesses, catalogs, catalog_settings, categories,
    products, product_images, product_variants,
    orders, order_items, order_status_history, inventory_movements,
    product_reviews, coupons,
    chatbot_configs, chatbot_knowledge_entries
    CASCADE`);
  console.log('All tables truncated.');
}

main().catch(console.error);

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  // 1. Get a business to test with
  const businesses = await sql`SELECT id, name FROM businesses LIMIT 5`;
  console.log('Businesses found:', businesses);

  if (businesses.length === 0) {
    console.log('No businesses found. Create one first.');
    return;
  }

  const businessId = businesses[0].id as string;
  console.log(`\nUsing business: ${businesses[0].name} (${businessId})`);

  // 2. Insert AI quota (ia_starter: 500 messages)
  await sql`
    INSERT INTO business_ai_quotas (id, business_id, ai_plan_type, ai_messages_used, ai_messages_limit, billing_cycle_start, created_at, updated_at)
    VALUES (gen_random_uuid(), ${businessId}, 'ia_starter', 0, 500, now(), now(), now())
    ON CONFLICT (business_id) DO UPDATE SET ai_plan_type = 'ia_starter', ai_messages_used = 0, ai_messages_limit = 500, billing_cycle_start = now(), updated_at = now()
  `;

  console.log('✓ AI quota seeded: ia_starter (500 messages/month)');

  // Verify
  const [quota] = await sql`SELECT * FROM business_ai_quotas WHERE business_id = ${businessId}`;
  console.log('\nQuota record:', quota);
}

main().catch(console.error);

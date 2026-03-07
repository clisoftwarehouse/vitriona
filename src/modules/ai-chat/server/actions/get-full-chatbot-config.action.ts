import { eq } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { chatbotConfigs } from '@/db/schema';

export async function getChatbotConfigByBusinessId(businessId: string) {
  try {
    const [config] = await db.select().from(chatbotConfigs).where(eq(chatbotConfigs.businessId, businessId)).limit(1);
    return config ?? null;
  } catch {
    return null;
  }
}

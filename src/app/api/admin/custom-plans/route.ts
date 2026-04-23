import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db/drizzle';
import { businesses } from '@/db/schema';
import { revalidateBusinessCache } from '@/lib/cache-revalidation';

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

/**
 * Admin endpoint to read/set custom plan overrides for a business.
 * Overrides sit on top of the base plan and apply to a single business.
 *
 * Auth: Bearer token via ADMIN_API_KEY.
 *
 * GET  /api/admin/custom-plans?businessId=...
 *   → { businessId, plan, overrides: {...}, note }
 *
 * PATCH /api/admin/custom-plans
 *   body: {
 *     businessId: string,
 *     overrides?: {
 *       customMaxProducts?: number | null,
 *       customMaxVisitsPerMonth?: number | null,
 *       customMaxPaymentMethods?: number | null,   // -1 = unlimited, null = reset to plan default
 *       customMaxDeliveryMethods?: number | null,
 *     },
 *     note?: string | null,   // human-readable note visible to the business owner
 *   }
 */

const OVERRIDE_FIELDS = [
  'customMaxProducts',
  'customMaxVisitsPerMonth',
  'customMaxPaymentMethods',
  'customMaxDeliveryMethods',
] as const;

type OverrideField = (typeof OVERRIDE_FIELDS)[number];

function validateOverride(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error('Override values must be integers, null, or omitted.');
  }
  if (value < -1) {
    throw new Error('Override values must be >= -1 (use -1 for unlimited).');
  }
  return value;
}

async function authorize(request: NextRequest) {
  if (!ADMIN_API_KEY) {
    return NextResponse.json({ error: 'ADMIN_API_KEY not configured' }, { status: 500 });
  }
  const header = request.headers.get('authorization');
  if (header !== `Bearer ${ADMIN_API_KEY}`) return unauthorized();
  return null;
}

export async function GET(request: NextRequest) {
  const authError = await authorize(request);
  if (authError) return authError;

  const businessId = request.nextUrl.searchParams.get('businessId');
  if (!businessId) {
    return NextResponse.json({ error: 'businessId query param is required' }, { status: 400 });
  }

  const [business] = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      plan: businesses.plan,
      customMaxProducts: businesses.customMaxProducts,
      customMaxVisitsPerMonth: businesses.customMaxVisitsPerMonth,
      customMaxPaymentMethods: businesses.customMaxPaymentMethods,
      customMaxDeliveryMethods: businesses.customMaxDeliveryMethods,
      customLimitsNote: businesses.customLimitsNote,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  return NextResponse.json({
    businessId: business.id,
    name: business.name,
    plan: business.plan,
    overrides: {
      customMaxProducts: business.customMaxProducts,
      customMaxVisitsPerMonth: business.customMaxVisitsPerMonth,
      customMaxPaymentMethods: business.customMaxPaymentMethods,
      customMaxDeliveryMethods: business.customMaxDeliveryMethods,
    },
    note: business.customLimitsNote,
  });
}

export async function PATCH(request: NextRequest) {
  const authError = await authorize(request);
  if (authError) return authError;

  let body: {
    businessId?: string;
    overrides?: Partial<Record<OverrideField, number | null>>;
    note?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.businessId) {
    return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
  }

  const update: Record<string, number | string | null | Date> = { updatedAt: new Date() };

  if (body.overrides) {
    for (const field of OVERRIDE_FIELDS) {
      try {
        const validated = validateOverride(body.overrides[field]);
        if (validated !== undefined) update[field] = validated;
      } catch (err) {
        return NextResponse.json(
          { error: `Invalid override for ${field}: ${(err as Error).message}` },
          { status: 400 }
        );
      }
    }
  }

  if (body.note !== undefined) {
    update.customLimitsNote = body.note ? body.note.slice(0, 500) : null;
  }

  const [updated] = await db.update(businesses).set(update).where(eq(businesses.id, body.businessId)).returning({
    id: businesses.id,
    slug: businesses.slug,
    plan: businesses.plan,
    customMaxProducts: businesses.customMaxProducts,
    customMaxVisitsPerMonth: businesses.customMaxVisitsPerMonth,
    customMaxPaymentMethods: businesses.customMaxPaymentMethods,
    customMaxDeliveryMethods: businesses.customMaxDeliveryMethods,
    customLimitsNote: businesses.customLimitsNote,
  });

  if (!updated) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  revalidateBusinessCache(updated.slug);

  return NextResponse.json({
    businessId: updated.id,
    plan: updated.plan,
    overrides: {
      customMaxProducts: updated.customMaxProducts,
      customMaxVisitsPerMonth: updated.customMaxVisitsPerMonth,
      customMaxPaymentMethods: updated.customMaxPaymentMethods,
      customMaxDeliveryMethods: updated.customMaxDeliveryMethods,
    },
    note: updated.customLimitsNote,
  });
}

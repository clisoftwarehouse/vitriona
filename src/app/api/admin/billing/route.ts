import { sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db/drizzle';

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

/**
 * GET /api/admin/billing
 *
 * Protected admin endpoint for external dashboard.
 * Returns revenue data, transaction history, and platform stats.
 *
 * Auth: Bearer token via ADMIN_API_KEY
 *
 * Query params:
 *   - from: ISO date string (optional, defaults to 30 days ago)
 *   - to: ISO date string (optional, defaults to now)
 *   - status: 'pending' | 'approved' | 'rejected' | 'all' (default: 'all')
 *   - limit: number (default: 100, max: 500)
 *   - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  // Auth check
  if (!ADMIN_API_KEY) {
    return NextResponse.json({ error: 'ADMIN_API_KEY not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ') || authHeader.slice(7) !== ADMIN_API_KEY) {
    return unauthorized();
  }

  const { searchParams } = request.nextUrl;
  const fromDate = searchParams.get('from')
    ? new Date(searchParams.get('from')!)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = searchParams.get('to') ? new Date(searchParams.get('to')!) : new Date();
  const statusFilter = searchParams.get('status') ?? 'all';
  const limit = Math.min(Number(searchParams.get('limit') ?? 100), 500);
  const offset = Number(searchParams.get('offset') ?? 0);

  try {
    // ── 1. Summary stats ──
    const summaryResult = await db.execute(sql`
      WITH all_transactions AS (
        SELECT amount::numeric, status, created_at, 'plan' as category, request_type
        FROM upgrade_requests
        WHERE created_at >= ${fromDate} AND created_at <= ${toDate}
        UNION ALL
        SELECT amount::numeric, status, created_at,
          CASE WHEN request_type = 'addon_credits' THEN 'ai_credits' ELSE 'ai_plan' END as category,
          request_type
        FROM chatbot_activation_requests
        WHERE created_at >= ${fromDate} AND created_at <= ${toDate}
      )
      SELECT
        COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
        COUNT(*) as total_count,
        COALESCE(SUM(amount) FILTER (WHERE status = 'approved'), 0) as total_revenue,
        COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_revenue,
        COALESCE(SUM(amount) FILTER (WHERE status = 'approved' AND category = 'plan'), 0) as plan_revenue,
        COALESCE(SUM(amount) FILTER (WHERE status = 'approved' AND category = 'ai_plan'), 0) as ai_plan_revenue,
        COALESCE(SUM(amount) FILTER (WHERE status = 'approved' AND category = 'ai_credits'), 0) as ai_credits_revenue
      FROM all_transactions
    `);
    const summary = summaryResult.rows[0] ?? {};

    // ── 2. Revenue by month (last 12 months) ──
    const revenueByMonth = await db.execute(sql`
      WITH all_approved AS (
        SELECT amount::numeric, created_at, 'plan' as category
        FROM upgrade_requests
        WHERE status = 'approved' AND created_at >= NOW() - INTERVAL '12 months'
        UNION ALL
        SELECT amount::numeric, created_at,
          CASE WHEN request_type = 'addon_credits' THEN 'ai_credits' ELSE 'ai_plan' END as category
        FROM chatbot_activation_requests
        WHERE status = 'approved' AND created_at >= NOW() - INTERVAL '12 months'
      )
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COALESCE(SUM(amount), 0) as total,
        COALESCE(SUM(amount) FILTER (WHERE category = 'plan'), 0) as plan_total,
        COALESCE(SUM(amount) FILTER (WHERE category = 'ai_plan'), 0) as ai_plan_total,
        COALESCE(SUM(amount) FILTER (WHERE category = 'ai_credits'), 0) as ai_credits_total,
        COUNT(*) as transaction_count
      FROM all_approved
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
    `);

    // ── 3. Transaction list (paginated) ──
    const statusCondition = statusFilter !== 'all' ? sql`AND t.status = ${statusFilter}` : sql``;

    const transactions = await db.execute(sql`
      WITH all_transactions AS (
        SELECT
          ur.id,
          'plan' as type,
          ur.request_type,
          ur.plan as plan_or_ai_type,
          ur.billing_cycle,
          ur.payment_method,
          ur.reference_id,
          ur.amount::numeric,
          ur.full_name,
          ur.email,
          ur.status,
          ur.created_at,
          ur.updated_at,
          b.name as business_name,
          b.slug as business_slug,
          u.name as user_name,
          u.email as user_email
        FROM upgrade_requests ur
        JOIN businesses b ON b.id = ur.business_id
        JOIN users u ON u.id = ur.user_id
        WHERE ur.created_at >= ${fromDate} AND ur.created_at <= ${toDate}
        UNION ALL
        SELECT
          car.id,
          CASE WHEN car.request_type = 'addon_credits' THEN 'ai_credits' ELSE 'ai_plan' END as type,
          car.request_type,
          car.ai_plan_type as plan_or_ai_type,
          car.billing_cycle,
          car.payment_method,
          car.reference_id,
          car.amount::numeric,
          car.full_name,
          car.email,
          car.status,
          car.created_at,
          car.updated_at,
          b.name as business_name,
          b.slug as business_slug,
          u.name as user_name,
          u.email as user_email
        FROM chatbot_activation_requests car
        JOIN businesses b ON b.id = car.business_id
        JOIN users u ON u.id = car.user_id
        WHERE car.created_at >= ${fromDate} AND car.created_at <= ${toDate}
      )
      SELECT * FROM all_transactions t
      WHERE 1=1 ${statusCondition}
      ORDER BY t.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    // ── 4. Platform overview ──
    const platformResult = await db.execute(sql`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM businesses) as total_businesses,
        (SELECT COUNT(*) FROM businesses WHERE plan = 'pro') as pro_businesses,
        (SELECT COUNT(*) FROM businesses WHERE plan = 'business') as business_businesses,
        (SELECT COUNT(*) FROM businesses WHERE plan = 'free') as free_businesses,
        (SELECT COUNT(*) FROM business_ai_quotas) as ai_enabled_businesses
    `);
    const platform = platformResult.rows[0] ?? {};

    return NextResponse.json({
      app: 'vitriona',
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      summary,
      revenueByMonth: revenueByMonth.rows,
      transactions: transactions.rows,
      pagination: { limit, offset, hasMore: transactions.rows.length === limit },
      platform,
    });
  } catch (error) {
    console.error('Admin billing API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

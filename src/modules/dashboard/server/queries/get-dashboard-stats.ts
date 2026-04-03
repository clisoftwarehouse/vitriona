'use server';

import { eq, ne, and, sum, gte, sql, desc, count } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { orders, products, businesses, orderItems, productReviews } from '@/db/schema';
import { type DashboardTimeframe, getDashboardTimeframeMeta } from '@/modules/dashboard/lib/dashboard-timeframe';

interface DashboardStats {
  revenue: { current: number; previous: number };
  orders: { current: number; previous: number };
  products: { total: number; active: number };
  reviews: { pending: number };
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: string;
  status: string;
  createdAt: Date;
  firstProductName: string | null;
}

interface RevenueBucketRow {
  bucket: string;
  revenue: string | null;
  orderCount: number;
}

export async function getDashboardStats(businessId: string, timeframe: DashboardTimeframe) {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Verify ownership
  const [biz] = await db
    .select({ id: businesses.id, currency: businesses.currency })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id)))
    .limit(1);
  if (!biz) return null;

  const timeframeMeta = getDashboardTimeframeMeta(timeframe);

  const [currentPeriod] = await db
    .select({
      revenue: sum(orders.total),
      orderCount: count(),
    })
    .from(orders)
    .where(
      and(
        eq(orders.businessId, businessId),
        gte(orders.createdAt, timeframeMeta.currentStart),
        sql`${orders.createdAt} < ${timeframeMeta.currentEnd}`,
        ne(orders.status, 'cancelled')
      )
    );

  const [previousPeriod] = await db
    .select({
      revenue: sum(orders.total),
      orderCount: count(),
    })
    .from(orders)
    .where(
      and(
        eq(orders.businessId, businessId),
        gte(orders.createdAt, timeframeMeta.previousStart),
        sql`${orders.createdAt} < ${timeframeMeta.previousEnd}`,
        ne(orders.status, 'cancelled')
      )
    );

  // Total products
  const [productStats] = await db
    .select({
      total: count(),
      active: count(sql`CASE WHEN ${products.status} = 'active' THEN 1 END`),
    })
    .from(products)
    .where(eq(products.businessId, businessId));

  // Pending reviews
  const [reviewStats] = await db
    .select({ pending: count() })
    .from(productReviews)
    .where(and(eq(productReviews.businessId, businessId), eq(productReviews.isApproved, false)));

  const stats: DashboardStats = {
    revenue: {
      current: currentPeriod?.revenue ? parseFloat(currentPeriod.revenue) : 0,
      previous: previousPeriod?.revenue ? parseFloat(previousPeriod.revenue) : 0,
    },
    orders: {
      current: currentPeriod?.orderCount ?? 0,
      previous: previousPeriod?.orderCount ?? 0,
    },
    products: {
      total: productStats?.total ?? 0,
      active: productStats?.active ?? 0,
    },
    reviews: {
      pending: reviewStats?.pending ?? 0,
    },
  };

  const recentOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
      total: orders.total,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(
      and(
        eq(orders.businessId, businessId),
        gte(orders.createdAt, timeframeMeta.currentStart),
        sql`${orders.createdAt} < ${timeframeMeta.currentEnd}`
      )
    )
    .orderBy(desc(orders.createdAt))
    .limit(10);

  // Fetch first product name for each recent order
  const orderIds = recentOrders.map((o) => o.id);
  const firstItems: Record<string, string> = {};
  if (orderIds.length > 0) {
    for (const oid of orderIds) {
      const [item] = await db
        .select({ productName: orderItems.productName })
        .from(orderItems)
        .where(eq(orderItems.orderId, oid))
        .limit(1);
      if (item) firstItems[oid] = item.productName;
    }
  }

  const recentOrdersWithProduct: RecentOrder[] = recentOrders.map((o) => ({
    ...o,
    firstProductName: firstItems[o.id] ?? null,
  }));

  const revenueBuckets: RevenueBucketRow[] =
    timeframeMeta.chartGranularity === 'hour'
      ? await db
          .select({
            bucket: sql<string>`to_char(date_trunc('hour', ${orders.createdAt}), 'HH24')`,
            revenue: sum(orders.total),
            orderCount: count(),
          })
          .from(orders)
          .where(
            and(
              eq(orders.businessId, businessId),
              gte(orders.createdAt, timeframeMeta.currentStart),
              sql`${orders.createdAt} < ${timeframeMeta.currentEnd}`,
              ne(orders.status, 'cancelled')
            )
          )
          .groupBy(sql`date_trunc('hour', ${orders.createdAt})`)
          .orderBy(sql`date_trunc('hour', ${orders.createdAt})`)
      : await db
          .select({
            bucket: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
            revenue: sum(orders.total),
            orderCount: count(),
          })
          .from(orders)
          .where(
            and(
              eq(orders.businessId, businessId),
              gte(orders.createdAt, timeframeMeta.currentStart),
              sql`${orders.createdAt} < ${timeframeMeta.currentEnd}`,
              ne(orders.status, 'cancelled')
            )
          )
          .groupBy(sql`date_trunc('day', ${orders.createdAt})`)
          .orderBy(sql`date_trunc('day', ${orders.createdAt})`);

  const dailyRevenue: { date: string; revenue: number; orders: number }[] = [];
  const revenueMap = new Map(revenueBuckets.map((bucket) => [bucket.bucket, bucket]));
  for (const key of timeframeMeta.chartBuckets) {
    const row = revenueMap.get(key);
    dailyRevenue.push({
      date: key,
      revenue: row?.revenue ? parseFloat(row.revenue) : 0,
      orders: row?.orderCount ?? 0,
    });
  }

  const topProducts = await db
    .select({
      productName: orderItems.productName,
      totalQty: sum(orderItems.quantity),
      totalRevenue: sum(orderItems.subtotal),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orders.businessId, businessId),
        gte(orders.createdAt, timeframeMeta.currentStart),
        sql`${orders.createdAt} < ${timeframeMeta.currentEnd}`,
        ne(orders.status, 'cancelled')
      )
    )
    .groupBy(orderItems.productName)
    .orderBy(desc(sum(orderItems.quantity)))
    .limit(5);

  const topSellingProducts = topProducts.map((p) => ({
    name: p.productName,
    quantity: p.totalQty ? parseInt(p.totalQty as string) : 0,
    revenue: p.totalRevenue ? parseFloat(p.totalRevenue as string) : 0,
  }));

  const ordersByStatus = await db
    .select({
      status: orders.status,
      count: count(),
    })
    .from(orders)
    .where(
      and(
        eq(orders.businessId, businessId),
        gte(orders.createdAt, timeframeMeta.currentStart),
        sql`${orders.createdAt} < ${timeframeMeta.currentEnd}`
      )
    )
    .groupBy(orders.status);

  const statusBreakdown = ordersByStatus.map((r) => ({
    status: r.status,
    count: r.count,
  }));

  return {
    stats,
    recentOrders: recentOrdersWithProduct,
    currency: biz.currency,
    dailyRevenue,
    topSellingProducts,
    statusBreakdown,
  };
}

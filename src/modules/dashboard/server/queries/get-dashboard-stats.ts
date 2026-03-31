'use server';

import { eq, ne, and, sum, gte, sql, desc, count } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { orders, products, businesses, orderItems, productReviews } from '@/db/schema';

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

export async function getDashboardStats(businessId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Verify ownership
  const [biz] = await db
    .select({ id: businesses.id, currency: businesses.currency })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id)))
    .limit(1);
  if (!biz) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Current month revenue + order count (exclude cancelled)
  const [currentMonth] = await db
    .select({
      revenue: sum(orders.total),
      orderCount: count(),
    })
    .from(orders)
    .where(and(eq(orders.businessId, businessId), gte(orders.createdAt, startOfMonth), ne(orders.status, 'cancelled')));

  // Previous month revenue + order count
  const [prevMonth] = await db
    .select({
      revenue: sum(orders.total),
      orderCount: count(),
    })
    .from(orders)
    .where(
      and(
        eq(orders.businessId, businessId),
        gte(orders.createdAt, startOfPrevMonth),
        sql`${orders.createdAt} < ${startOfMonth}`,
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
      current: currentMonth?.revenue ? parseFloat(currentMonth.revenue) : 0,
      previous: prevMonth?.revenue ? parseFloat(prevMonth.revenue) : 0,
    },
    orders: {
      current: currentMonth?.orderCount ?? 0,
      previous: prevMonth?.orderCount ?? 0,
    },
    products: {
      total: productStats?.total ?? 0,
      active: productStats?.active ?? 0,
    },
    reviews: {
      pending: reviewStats?.pending ?? 0,
    },
  };

  // Recent orders (last 10)
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
    .where(eq(orders.businessId, businessId))
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

  // Daily revenue for last 30 days
  const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
  const dailyRevenueRows = await db
    .select({
      day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
      revenue: sum(orders.total),
      orderCount: count(),
    })
    .from(orders)
    .where(and(eq(orders.businessId, businessId), gte(orders.createdAt, thirtyDaysAgo), ne(orders.status, 'cancelled')))
    .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`);

  // Fill in missing days with 0
  const dailyRevenue: { date: string; revenue: number; orders: number }[] = [];
  const revenueMap = new Map(dailyRevenueRows.map((r) => [r.day, r]));
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const row = revenueMap.get(key);
    dailyRevenue.push({
      date: key,
      revenue: row?.revenue ? parseFloat(row.revenue) : 0,
      orders: row?.orderCount ?? 0,
    });
  }

  // Top selling products (by quantity sold, last 30 days)
  const topProducts = await db
    .select({
      productName: orderItems.productName,
      totalQty: sum(orderItems.quantity),
      totalRevenue: sum(orderItems.subtotal),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orders.businessId, businessId), gte(orders.createdAt, thirtyDaysAgo), ne(orders.status, 'cancelled')))
    .groupBy(orderItems.productName)
    .orderBy(desc(sum(orderItems.quantity)))
    .limit(5);

  const topSellingProducts = topProducts.map((p) => ({
    name: p.productName,
    quantity: p.totalQty ? parseInt(p.totalQty as string) : 0,
    revenue: p.totalRevenue ? parseFloat(p.totalRevenue as string) : 0,
  }));

  // Orders by status
  const ordersByStatus = await db
    .select({
      status: orders.status,
      count: count(),
    })
    .from(orders)
    .where(and(eq(orders.businessId, businessId), gte(orders.createdAt, startOfMonth)))
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

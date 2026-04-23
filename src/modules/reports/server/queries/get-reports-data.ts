'use server';

import { eq, ne, and, sum, gte, sql, asc, desc, count } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { type ReportTimeframe, getReportTimeframeMeta } from '@/modules/reports/lib/report-timeframe';
import { notDeletedOrder, notDeletedCoupon, notDeletedProduct, notDeletedBusiness } from '@/db/soft-delete';
import { orders, coupons, products, businesses, orderItems, categories, inventoryMovements } from '@/db/schema';

// ── Sales Report ──

export interface SalesReportData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalDiscount: number;
    totalShipping: number;
  };
  byStatus: { status: string; count: number; revenue: number }[];
  byPaymentMethod: { method: string; count: number; revenue: number }[];
  byCheckoutType: { type: string; count: number; revenue: number }[];
  dailyTrend: { date: string; revenue: number; orders: number }[];
  currency: string;
}

export async function getSalesReport(businessId: string, timeframe: ReportTimeframe): Promise<SalesReportData | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [biz] = await db
    .select({ id: businesses.id, currency: businesses.currency })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id), notDeletedBusiness))
    .limit(1);
  if (!biz) return null;

  const meta = getReportTimeframeMeta(timeframe);
  const dateFilter = and(
    eq(orders.businessId, businessId),
    gte(orders.createdAt, meta.start),
    sql`${orders.createdAt} < ${meta.end}`,
    notDeletedOrder
  );
  const activeDateFilter = and(dateFilter, ne(orders.status, 'cancelled'));

  const [totals] = await db
    .select({
      revenue: sum(orders.total),
      orderCount: count(),
      discount: sum(orders.discount),
      shipping: sum(orders.shippingCost),
    })
    .from(orders)
    .where(activeDateFilter);

  const totalRevenue = totals?.revenue ? parseFloat(totals.revenue) : 0;
  const totalOrders = totals?.orderCount ?? 0;

  const byStatus = await db
    .select({ status: orders.status, count: count(), revenue: sum(orders.total) })
    .from(orders)
    .where(dateFilter)
    .groupBy(orders.status);

  const byPaymentMethod = await db
    .select({ method: orders.paymentMethodName, count: count(), revenue: sum(orders.total) })
    .from(orders)
    .where(activeDateFilter)
    .groupBy(orders.paymentMethodName)
    .orderBy(desc(sum(orders.total)));

  const byCheckoutType = await db
    .select({ type: orders.checkoutType, count: count(), revenue: sum(orders.total) })
    .from(orders)
    .where(activeDateFilter)
    .groupBy(orders.checkoutType)
    .orderBy(desc(count()));

  const dailyRows = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
      revenue: sum(orders.total),
      orders: count(),
    })
    .from(orders)
    .where(activeDateFilter)
    .groupBy(sql`date_trunc('day', ${orders.createdAt})`)
    .orderBy(asc(sql`date_trunc('day', ${orders.createdAt})`));

  return {
    summary: {
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      totalDiscount: totals?.discount ? parseFloat(totals.discount) : 0,
      totalShipping: totals?.shipping ? parseFloat(totals.shipping) : 0,
    },
    byStatus: byStatus.map((r) => ({
      status: r.status,
      count: r.count,
      revenue: r.revenue ? parseFloat(r.revenue) : 0,
    })),
    byPaymentMethod: byPaymentMethod.map((r) => ({
      method: r.method ?? 'Sin especificar',
      count: r.count,
      revenue: r.revenue ? parseFloat(r.revenue) : 0,
    })),
    byCheckoutType: byCheckoutType.map((r) => ({
      type: r.type,
      count: r.count,
      revenue: r.revenue ? parseFloat(r.revenue) : 0,
    })),
    dailyTrend: dailyRows.map((r) => ({
      date: r.date,
      revenue: r.revenue ? parseFloat(r.revenue) : 0,
      orders: r.orders,
    })),
    currency: biz.currency,
  };
}

// ── Products Report ──

export interface ProductsReportData {
  topSelling: { name: string; sku: string | null; quantity: number; revenue: number }[];
  byCategory: { category: string; productCount: number; revenue: number }[];
  stockSummary: {
    totalProducts: number;
    active: number;
    inactive: number;
    outOfStock: number;
    lowStock: number;
  };
  lowStockItems: { name: string; sku: string | null; stock: number; minStock: number }[];
  currency: string;
}

export async function getProductsReport(
  businessId: string,
  timeframe: ReportTimeframe
): Promise<ProductsReportData | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [biz] = await db
    .select({ id: businesses.id, currency: businesses.currency })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id), notDeletedBusiness))
    .limit(1);
  if (!biz) return null;

  const meta = getReportTimeframeMeta(timeframe);

  const topSelling = await db
    .select({
      name: orderItems.productName,
      quantity: sum(orderItems.quantity),
      revenue: sum(orderItems.subtotal),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orders.businessId, businessId),
        gte(orders.createdAt, meta.start),
        sql`${orders.createdAt} < ${meta.end}`,
        ne(orders.status, 'cancelled'),
        notDeletedOrder
      )
    )
    .groupBy(orderItems.productName)
    .orderBy(desc(sum(orderItems.quantity)))
    .limit(20);

  const byCategory = await db
    .select({
      category: sql<string>`COALESCE(${categories.name}, 'Sin categoría')`,
      productCount: count(sql`DISTINCT ${orderItems.productId}`),
      revenue: sum(orderItems.subtotal),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .leftJoin(products, eq(orderItems.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        eq(orders.businessId, businessId),
        gte(orders.createdAt, meta.start),
        sql`${orders.createdAt} < ${meta.end}`,
        ne(orders.status, 'cancelled'),
        notDeletedOrder
      )
    )
    .groupBy(categories.name)
    .orderBy(desc(sum(orderItems.subtotal)));

  const [stockCounts] = await db
    .select({
      total: count(),
      active: count(sql`CASE WHEN ${products.status} = 'active' THEN 1 END`),
      inactive: count(sql`CASE WHEN ${products.status} = 'inactive' THEN 1 END`),
      outOfStock: count(sql`CASE WHEN ${products.status} = 'out_of_stock' THEN 1 END`),
      lowStock: count(
        sql`CASE WHEN ${products.trackInventory} = true AND ${products.stock} <= ${products.minStock} AND ${products.status} = 'active' THEN 1 END`
      ),
    })
    .from(products)
    .where(and(eq(products.businessId, businessId), notDeletedProduct));

  const lowStockItems = await db
    .select({
      name: products.name,
      sku: products.sku,
      stock: products.stock,
      minStock: products.minStock,
    })
    .from(products)
    .where(
      and(
        eq(products.businessId, businessId),
        eq(products.trackInventory, true),
        eq(products.status, 'active'),
        sql`${products.stock} <= ${products.minStock}`,
        notDeletedProduct
      )
    )
    .orderBy(asc(products.stock))
    .limit(20);

  return {
    topSelling: topSelling.map((p) => ({
      name: p.name,
      sku: null,
      quantity: p.quantity ? parseInt(p.quantity as string) : 0,
      revenue: p.revenue ? parseFloat(p.revenue as string) : 0,
    })),
    byCategory: byCategory.map((c) => ({
      category: c.category,
      productCount: c.productCount,
      revenue: c.revenue ? parseFloat(c.revenue as string) : 0,
    })),
    stockSummary: {
      totalProducts: stockCounts?.total ?? 0,
      active: stockCounts?.active ?? 0,
      inactive: stockCounts?.inactive ?? 0,
      outOfStock: stockCounts?.outOfStock ?? 0,
      lowStock: stockCounts?.lowStock ?? 0,
    },
    lowStockItems: lowStockItems.map((i) => ({
      name: i.name,
      sku: i.sku,
      stock: i.stock ?? 0,
      minStock: i.minStock ?? 0,
    })),
    currency: biz.currency,
  };
}

// ── Inventory Report ──

export interface InventoryReportData {
  movements: {
    id: string;
    productName: string;
    type: string;
    quantity: number;
    reason: string | null;
    previousStock: number;
    newStock: number;
    createdAt: Date;
  }[];
  movementSummary: { type: string; count: number; totalQty: number }[];
  currency: string;
}

export async function getInventoryReport(
  businessId: string,
  timeframe: ReportTimeframe
): Promise<InventoryReportData | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [biz] = await db
    .select({ id: businesses.id, currency: businesses.currency })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id), notDeletedBusiness))
    .limit(1);
  if (!biz) return null;

  const meta = getReportTimeframeMeta(timeframe);

  const movements = await db
    .select({
      id: inventoryMovements.id,
      productName: products.name,
      type: inventoryMovements.type,
      quantity: inventoryMovements.quantity,
      reason: inventoryMovements.reason,
      previousStock: inventoryMovements.previousStock,
      newStock: inventoryMovements.newStock,
      createdAt: inventoryMovements.createdAt,
    })
    .from(inventoryMovements)
    .innerJoin(products, eq(inventoryMovements.productId, products.id))
    .where(
      and(
        eq(products.businessId, businessId),
        gte(inventoryMovements.createdAt, meta.start),
        sql`${inventoryMovements.createdAt} < ${meta.end}`
      )
    )
    .orderBy(desc(inventoryMovements.createdAt))
    .limit(200);

  const movementSummary = await db
    .select({
      type: inventoryMovements.type,
      count: count(),
      totalQty: sum(inventoryMovements.quantity),
    })
    .from(inventoryMovements)
    .innerJoin(products, eq(inventoryMovements.productId, products.id))
    .where(
      and(
        eq(products.businessId, businessId),
        gte(inventoryMovements.createdAt, meta.start),
        sql`${inventoryMovements.createdAt} < ${meta.end}`
      )
    )
    .groupBy(inventoryMovements.type);

  return {
    movements: movements.map((m) => ({
      ...m,
      productName: m.productName,
    })),
    movementSummary: movementSummary.map((s) => ({
      type: s.type,
      count: s.count,
      totalQty: s.totalQty ? parseInt(s.totalQty as string) : 0,
    })),
    currency: biz.currency,
  };
}

// ── Customers Report ──

export interface CustomersReportData {
  topCustomers: {
    name: string;
    email: string | null;
    phone: string | null;
    orderCount: number;
    totalSpent: number;
  }[];
  summary: {
    uniqueCustomers: number;
    repeatCustomers: number;
    repeatRate: number;
    averageSpendPerCustomer: number;
  };
  currency: string;
}

export async function getCustomersReport(
  businessId: string,
  timeframe: ReportTimeframe
): Promise<CustomersReportData | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [biz] = await db
    .select({ id: businesses.id, currency: businesses.currency })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id), notDeletedBusiness))
    .limit(1);
  if (!biz) return null;

  const meta = getReportTimeframeMeta(timeframe);
  const filter = and(
    eq(orders.businessId, businessId),
    gte(orders.createdAt, meta.start),
    sql`${orders.createdAt} < ${meta.end}`,
    ne(orders.status, 'cancelled'),
    notDeletedOrder
  );

  const topCustomers = await db
    .select({
      name: orders.customerName,
      email: orders.customerEmail,
      phone: orders.customerPhone,
      orderCount: count(),
      totalSpent: sum(orders.total),
    })
    .from(orders)
    .where(filter)
    .groupBy(orders.customerName, orders.customerEmail, orders.customerPhone)
    .orderBy(desc(sum(orders.total)))
    .limit(20);

  const allCustomers = await db
    .select({
      name: orders.customerName,
      orderCount: count(),
      totalSpent: sum(orders.total),
    })
    .from(orders)
    .where(filter)
    .groupBy(orders.customerName);

  const uniqueCustomers = allCustomers.length;
  const repeatCustomers = allCustomers.filter((c) => c.orderCount > 1).length;
  const totalSpentAll = allCustomers.reduce(
    (acc, c) => acc + (c.totalSpent ? parseFloat(c.totalSpent as string) : 0),
    0
  );

  return {
    topCustomers: topCustomers.map((c) => ({
      name: c.name,
      email: c.email,
      phone: c.phone,
      orderCount: c.orderCount,
      totalSpent: c.totalSpent ? parseFloat(c.totalSpent as string) : 0,
    })),
    summary: {
      uniqueCustomers,
      repeatCustomers,
      repeatRate: uniqueCustomers > 0 ? (repeatCustomers / uniqueCustomers) * 100 : 0,
      averageSpendPerCustomer: uniqueCustomers > 0 ? totalSpentAll / uniqueCustomers : 0,
    },
    currency: biz.currency,
  };
}

// ── Coupons Report ──

export interface CouponsReportData {
  coupons: {
    code: string;
    description: string | null;
    discountType: string;
    discountValue: string;
    usageCount: number;
    usageLimit: number | null;
    totalDiscountGiven: number;
    ordersUsed: number;
    isActive: boolean;
    expiresAt: Date | null;
  }[];
  summary: {
    totalCoupons: number;
    activeCoupons: number;
    totalDiscountGiven: number;
    totalOrdersWithCoupon: number;
  };
  currency: string;
}

export async function getCouponsReport(
  businessId: string,
  timeframe: ReportTimeframe
): Promise<CouponsReportData | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [biz] = await db
    .select({ id: businesses.id, currency: businesses.currency })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id), notDeletedBusiness))
    .limit(1);
  if (!biz) return null;

  const meta = getReportTimeframeMeta(timeframe);

  const allCoupons = await db
    .select()
    .from(coupons)
    .where(and(eq(coupons.businessId, businessId), notDeletedCoupon))
    .orderBy(desc(coupons.createdAt));

  const ordersWithCoupons = await db
    .select({
      couponCode: orders.couponCode,
      discount: sum(orders.discount),
      count: count(),
    })
    .from(orders)
    .where(
      and(
        eq(orders.businessId, businessId),
        gte(orders.createdAt, meta.start),
        sql`${orders.createdAt} < ${meta.end}`,
        ne(orders.status, 'cancelled'),
        sql`${orders.couponCode} IS NOT NULL`,
        notDeletedOrder
      )
    )
    .groupBy(orders.couponCode);

  const couponUsageMap = new Map(ordersWithCoupons.map((o) => [o.couponCode, o]));

  const couponData = allCoupons.map((c) => {
    const usage = couponUsageMap.get(c.code);
    return {
      code: c.code,
      description: c.description,
      discountType: c.discountType,
      discountValue: c.discountValue,
      usageCount: c.usageCount,
      usageLimit: c.usageLimit,
      totalDiscountGiven: usage?.discount ? parseFloat(usage.discount as string) : 0,
      ordersUsed: usage?.count ?? 0,
      isActive: c.isActive,
      expiresAt: c.expiresAt,
    };
  });

  const totalDiscountGiven = couponData.reduce((acc, c) => acc + c.totalDiscountGiven, 0);
  const totalOrdersWithCoupon = ordersWithCoupons.reduce((acc, o) => acc + o.count, 0);

  return {
    coupons: couponData,
    summary: {
      totalCoupons: allCoupons.length,
      activeCoupons: allCoupons.filter((c) => c.isActive).length,
      totalDiscountGiven,
      totalOrdersWithCoupon,
    },
    currency: biz.currency,
  };
}

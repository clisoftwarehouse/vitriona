'use server';

import { eq, and, avg, desc, count } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { rateLimitAction } from '@/lib/rate-limit';
import { businesses, notifications, productReviews } from '@/db/schema';

/* ─── Public: get approved reviews for a product ─── */

export async function getProductReviews(productId: string) {
  return db
    .select()
    .from(productReviews)
    .where(and(eq(productReviews.productId, productId), eq(productReviews.isApproved, true)))
    .orderBy(desc(productReviews.createdAt));
}

/* ─── Public: get review stats (avg + count) ─── */

export async function getProductReviewStats(productId: string) {
  const [row] = await db
    .select({
      average: avg(productReviews.rating),
      total: count(),
    })
    .from(productReviews)
    .where(and(eq(productReviews.productId, productId), eq(productReviews.isApproved, true)));

  return {
    average: row?.average ? parseFloat(row.average) : 0,
    total: row?.total ?? 0,
  };
}

/* ─── Public: submit a review (pending approval) ─── */

export async function submitReviewAction(input: {
  productId: string;
  businessId: string;
  customerName: string;
  customerEmail?: string;
  rating: number;
  title?: string;
  comment?: string;
}) {
  try {
    const rl = await rateLimitAction(input.businessId, 'submit-review', 5, 60);
    if (!rl.success) return { error: 'Demasiados intentos. Espera un momento.' };

    if (!input.customerName.trim()) return { error: 'El nombre es requerido' };
    if (input.rating < 1 || input.rating > 5) return { error: 'La calificación debe ser entre 1 y 5' };

    await db.insert(productReviews).values({
      productId: input.productId,
      businessId: input.businessId,
      customerName: input.customerName.trim(),
      customerEmail: input.customerEmail?.trim() || null,
      rating: input.rating,
      title: input.title?.trim() || null,
      comment: input.comment?.trim() || null,
      isApproved: false,
    });

    // Notify business owner
    const [biz] = await db
      .select({ userId: businesses.userId })
      .from(businesses)
      .where(eq(businesses.id, input.businessId))
      .limit(1);
    if (biz?.userId) {
      const stars = '★'.repeat(input.rating) + '☆'.repeat(5 - input.rating);
      await db.insert(notifications).values({
        userId: biz.userId,
        businessId: input.businessId,
        type: 'new_review',
        title: 'Nueva reseña recibida',
        description: `${input.customerName.trim()} dejó ${stars} — pendiente de aprobación`,
        href: `/dashboard/businesses/${input.businessId}/reviews`,
      });
    }

    return { success: true };
  } catch {
    return { error: 'Error al enviar la reseña' };
  }
}

/* ─── Dashboard: get ALL reviews for a business (admin) ─── */

export async function getBusinessReviewsAction(businessId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado', data: [] };

    const [biz] = await db
      .select()
      .from(businesses)
      .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id)))
      .limit(1);
    if (!biz) return { error: 'No autorizado', data: [] };

    const reviews = await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.businessId, businessId))
      .orderBy(desc(productReviews.createdAt));

    return { data: reviews };
  } catch {
    return { error: 'Error al obtener reseñas', data: [] };
  }
}

/* ─── Dashboard: approve / reject a review ─── */

export async function toggleReviewApprovalAction(reviewId: string, approved: boolean) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [review] = await db.select().from(productReviews).where(eq(productReviews.id, reviewId)).limit(1);
    if (!review) return { error: 'Reseña no encontrada' };

    // Verify ownership
    const [biz] = await db
      .select()
      .from(businesses)
      .where(and(eq(businesses.id, review.businessId), eq(businesses.userId, session.user.id)))
      .limit(1);
    if (!biz) return { error: 'No autorizado' };

    await db.update(productReviews).set({ isApproved: approved }).where(eq(productReviews.id, reviewId));

    return { success: true };
  } catch {
    return { error: 'Error al actualizar reseña' };
  }
}

/* ─── Dashboard: delete a review ─── */

export async function deleteReviewAction(reviewId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [review] = await db.select().from(productReviews).where(eq(productReviews.id, reviewId)).limit(1);
    if (!review) return { error: 'Reseña no encontrada' };

    const [biz] = await db
      .select()
      .from(businesses)
      .where(and(eq(businesses.id, review.businessId), eq(businesses.userId, session.user.id)))
      .limit(1);
    if (!biz) return { error: 'No autorizado' };

    await db.delete(productReviews).where(eq(productReviews.id, reviewId));

    return { success: true };
  } catch {
    return { error: 'Error al eliminar reseña' };
  }
}

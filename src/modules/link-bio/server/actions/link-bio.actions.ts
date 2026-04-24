'use server';

import { revalidateTag } from 'next/cache';
import { eq, asc, and, sql, isNull, inArray, notInArray } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { linkPages, businesses, linkPageLinks } from '@/db/schema';
import type { LinkItemInput, LinkItemUpdateInput, LinkPageSettingsInput } from '../../ui/schemas/link-bio.schemas';
import {
  LINK_TYPES,
  linkItemSchema,
  linkItemUpdateSchema,
  linkPageSettingsSchema,
} from '../../ui/schemas/link-bio.schemas';

const SOCIAL_LINK_TYPES = [
  'instagram',
  'facebook',
  'tiktok',
  'twitter',
  'youtube',
  'whatsapp',
  'email',
  'phone',
] as const;
type SocialLinkType = (typeof SOCIAL_LINK_TYPES)[number];

// Unified server action return type so the client can rely on { success, error } everywhere.
export type ActionResult<T = null> = { success: true; data: T } | { success: false; error: string };

function firstIssueMessage(result: { error: { issues: Array<{ message: string }> } }): string {
  return result.error.issues[0]?.message ?? 'Datos inválidos';
}

const PURGE = { expire: 0 };

function revalidateLinkPage(businessId: string, slug: string) {
  revalidateTag(`link-page-business-${businessId}`, PURGE);
  revalidateTag(`link-page-${slug}`, PURGE);
}

async function verifyOwnership(businessId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('No autorizado');
  const [business] = await db
    .select({ id: businesses.id, slug: businesses.slug, userId: businesses.userId })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);
  if (!business || business.userId !== session.user.id) throw new Error('No autorizado');
  return business;
}

export async function getOrCreateLinkPageAction(businessId: string) {
  const business = await verifyOwnership(businessId);
  const [existing] = await db
    .select()
    .from(linkPages)
    .where(and(eq(linkPages.businessId, businessId), isNull(linkPages.deletedAt)))
    .limit(1);
  if (existing) {
    const links = await db
      .select()
      .from(linkPageLinks)
      .where(and(eq(linkPageLinks.linkPageId, existing.id), isNull(linkPageLinks.deletedAt)))
      .orderBy(asc(linkPageLinks.sortOrder));
    return { page: existing, links };
  }
  const [created] = await db.insert(linkPages).values({ businessId, title: business.slug, isActive: true }).returning();
  return { page: created, links: [] };
}

export async function updateLinkPageSettingsAction(
  businessId: string,
  input: LinkPageSettingsInput
): Promise<ActionResult> {
  try {
    const business = await verifyOwnership(businessId);
    const parsed = linkPageSettingsSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: firstIssueMessage(parsed) };
    }
    const data = parsed.data;
    const [existing] = await db
      .select({ id: linkPages.id })
      .from(linkPages)
      .where(and(eq(linkPages.businessId, businessId), isNull(linkPages.deletedAt)))
      .limit(1);
    if (!existing) return { success: false, error: 'Página de links no encontrada' };
    await db
      .update(linkPages)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(linkPages.id, existing.id));
    revalidateLinkPage(businessId, business.slug);
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'No se pudo guardar' };
  }
}

type CreatedLink = typeof linkPageLinks.$inferSelect;

export async function addLinkAction(businessId: string, input: LinkItemInput): Promise<ActionResult<CreatedLink>> {
  try {
    const business = await verifyOwnership(businessId);
    const parsed = linkItemSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: firstIssueMessage(parsed) };
    }
    const data = parsed.data;
    const [page] = await db
      .select({ id: linkPages.id })
      .from(linkPages)
      .where(and(eq(linkPages.businessId, businessId), isNull(linkPages.deletedAt)))
      .limit(1);
    if (!page) return { success: false, error: 'Página de links no encontrada' };
    const existingLinks = await db
      .select({ sortOrder: linkPageLinks.sortOrder })
      .from(linkPageLinks)
      .where(and(eq(linkPageLinks.linkPageId, page.id), isNull(linkPageLinks.deletedAt)))
      .orderBy(asc(linkPageLinks.sortOrder));
    const maxOrder = existingLinks.length > 0 ? (existingLinks[existingLinks.length - 1]?.sortOrder ?? -1) : -1;
    const [created] = await db
      .insert(linkPageLinks)
      .values({
        linkPageId: page.id,
        title: data.title,
        url: data.url,
        linkType: data.linkType,
        iconEmoji: data.iconEmoji || null,
        iconImageUrl: data.iconImageUrl || null,
        thumbnailUrl: data.thumbnailUrl || null,
        isActive: data.isActive,
        sortOrder: maxOrder + 1,
      })
      .returning();
    if (!created) return { success: false, error: 'No se pudo crear el link' };
    revalidateLinkPage(businessId, business.slug);
    return { success: true, data: created };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'No se pudo agregar el link' };
  }
}

export async function updateLinkAction(
  businessId: string,
  linkId: string,
  input: LinkItemUpdateInput
): Promise<ActionResult> {
  try {
    const business = await verifyOwnership(businessId);
    const parsed = linkItemUpdateSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: firstIssueMessage(parsed) };
    }
    const data = parsed.data;
    const [link] = await db
      .select({ id: linkPageLinks.id, linkPageId: linkPageLinks.linkPageId })
      .from(linkPageLinks)
      .where(and(eq(linkPageLinks.id, linkId), isNull(linkPageLinks.deletedAt)))
      .limit(1);
    if (!link) return { success: false, error: 'Link no encontrado' };
    const [page] = await db
      .select({ businessId: linkPages.businessId })
      .from(linkPages)
      .where(eq(linkPages.id, link.linkPageId))
      .limit(1);
    if (!page || page.businessId !== businessId) return { success: false, error: 'No autorizado' };
    await db
      .update(linkPageLinks)
      .set({
        ...(data.title !== undefined && { title: data.title }),
        ...(data.url !== undefined && { url: data.url }),
        ...(data.linkType !== undefined && { linkType: data.linkType }),
        ...(data.iconEmoji !== undefined && { iconEmoji: data.iconEmoji || null }),
        ...(data.iconImageUrl !== undefined && { iconImageUrl: data.iconImageUrl || null }),
        ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        updatedAt: new Date(),
      })
      .where(eq(linkPageLinks.id, linkId));
    revalidateLinkPage(businessId, business.slug);
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'No se pudo actualizar el link' };
  }
}

export async function deleteLinkAction(businessId: string, linkId: string) {
  const business = await verifyOwnership(businessId);
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const [link] = await db
    .select({ linkPageId: linkPageLinks.linkPageId })
    .from(linkPageLinks)
    .where(and(eq(linkPageLinks.id, linkId), isNull(linkPageLinks.deletedAt)))
    .limit(1);
  if (!link) throw new Error('Link no encontrado');
  const [page] = await db
    .select({ businessId: linkPages.businessId })
    .from(linkPages)
    .where(eq(linkPages.id, link.linkPageId))
    .limit(1);
  if (!page || page.businessId !== businessId) throw new Error('No autorizado');
  await db
    .update(linkPageLinks)
    .set({ deletedAt: new Date(), deletedBy: userId, updatedAt: new Date() })
    .where(eq(linkPageLinks.id, linkId));
  revalidateLinkPage(businessId, business.slug);
  return { success: true };
}

export async function reorderLinksAction(businessId: string, orderedIds: string[]) {
  const business = await verifyOwnership(businessId);
  if (orderedIds.length === 0) return { success: true };

  const [page] = await db
    .select({ id: linkPages.id })
    .from(linkPages)
    .where(and(eq(linkPages.businessId, businessId), isNull(linkPages.deletedAt)))
    .limit(1);
  if (!page) throw new Error('Página de links no encontrada');

  const owned = await db
    .select({ id: linkPageLinks.id })
    .from(linkPageLinks)
    .where(and(eq(linkPageLinks.linkPageId, page.id), inArray(linkPageLinks.id, orderedIds)));
  const ownedSet = new Set(owned.map((row) => row.id));
  const safeIds = orderedIds.filter((id) => ownedSet.has(id));
  if (safeIds.length === 0) return { success: true };

  const caseExpr = sql.join(
    [sql`CASE ${linkPageLinks.id}`, ...safeIds.map((id, index) => sql`WHEN ${id} THEN ${index}`), sql`END`],
    sql` `
  );

  await db
    .update(linkPageLinks)
    .set({ sortOrder: caseExpr, updatedAt: new Date() })
    .where(inArray(linkPageLinks.id, safeIds));

  revalidateLinkPage(businessId, business.slug);
  return { success: true };
}

export async function toggleLinkActiveAction(businessId: string, linkId: string, isActive: boolean) {
  return updateLinkAction(businessId, linkId, { isActive });
}

export async function seedSocialLinksAction(businessId: string) {
  const business = await verifyOwnership(businessId);
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const [biz] = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
  if (!biz) throw new Error('Negocio no encontrado');
  const [page] = await db
    .select({ id: linkPages.id })
    .from(linkPages)
    .where(and(eq(linkPages.businessId, businessId), isNull(linkPages.deletedAt)))
    .limit(1);
  if (!page) throw new Error('Página de links no encontrada');

  type SocialEntry = { type: SocialLinkType; url: string | null; label: string };
  const socialMap: SocialEntry[] = [
    { type: 'instagram', url: biz.instagramUrl, label: 'Instagram' },
    { type: 'facebook', url: biz.facebookUrl, label: 'Facebook' },
    { type: 'tiktok', url: biz.tiktokUrl, label: 'TikTok' },
    { type: 'twitter', url: biz.twitterUrl, label: 'Twitter / X' },
    { type: 'youtube', url: biz.youtubeUrl, label: 'YouTube' },
    {
      type: 'whatsapp',
      url: biz.whatsappNumber ? `https://wa.me/${biz.whatsappNumber.replace(/\D/g, '')}` : null,
      label: 'WhatsApp',
    },
    { type: 'email', url: biz.email ? `mailto:${biz.email}` : null, label: 'Correo' },
    { type: 'phone', url: biz.phone ? `tel:${biz.phone}` : null, label: 'Teléfono' },
  ];

  const toInsert = socialMap.filter((s): s is SocialEntry & { url: string } => Boolean(s.url));
  if (toInsert.length === 0) return { success: true, count: 0 };

  // neon-http has no transactions. Do INSERT → UPDATE so a failure between steps
  // leaves the previous socials intact (better than losing them on a failed insert).
  // If step 2 fails, re-running is safe: the new UPDATE will soft-delete the old social
  // rows while skipping the ones we just inserted via id-exclusion.
  const [maxRow] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${linkPageLinks.sortOrder}), -1)` })
    .from(linkPageLinks)
    .where(and(eq(linkPageLinks.linkPageId, page.id), isNull(linkPageLinks.deletedAt)));
  const startOrder = (maxRow?.maxOrder ?? -1) + 1;

  type ValidLinkType = (typeof linkPageLinks.$inferInsert)['linkType'];
  const inserted = await db
    .insert(linkPageLinks)
    .values(
      toInsert.map((item, i) => ({
        linkPageId: page.id,
        title: item.label,
        url: item.url,
        linkType: item.type as ValidLinkType,
        isActive: true,
        sortOrder: startOrder + i,
      }))
    )
    .returning({ id: linkPageLinks.id });

  const newIds = inserted.map((row) => row.id);
  await db
    .update(linkPageLinks)
    .set({ deletedAt: new Date(), deletedBy: userId, updatedAt: new Date() })
    .where(
      and(
        eq(linkPageLinks.linkPageId, page.id),
        isNull(linkPageLinks.deletedAt),
        inArray(linkPageLinks.linkType, SOCIAL_LINK_TYPES as unknown as (typeof LINK_TYPES)[number][]),
        notInArray(linkPageLinks.id, newIds)
      )
    );

  revalidateLinkPage(businessId, business.slug);
  return { success: true, count: toInsert.length };
}

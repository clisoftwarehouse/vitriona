'use server';

import { eq, asc } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { linkPages, businesses, linkPageLinks } from '@/db/schema';
import { linkItemSchema, linkPageSettingsSchema } from '../../ui/schemas/link-bio.schemas';
import type { LinkItemInput, LinkPageSettingsInput } from '../../ui/schemas/link-bio.schemas';

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
  const [existing] = await db.select().from(linkPages).where(eq(linkPages.businessId, businessId)).limit(1);
  if (existing) {
    const links = await db
      .select()
      .from(linkPageLinks)
      .where(eq(linkPageLinks.linkPageId, existing.id))
      .orderBy(asc(linkPageLinks.sortOrder));
    return { page: existing, links };
  }
  const [created] = await db.insert(linkPages).values({ businessId, title: business.slug, isActive: true }).returning();
  return { page: created, links: [] };
}

export async function updateLinkPageSettingsAction(businessId: string, input: LinkPageSettingsInput) {
  const business = await verifyOwnership(businessId);
  const data = linkPageSettingsSchema.parse(input);
  const [existing] = await db
    .select({ id: linkPages.id })
    .from(linkPages)
    .where(eq(linkPages.businessId, businessId))
    .limit(1);
  if (!existing) throw new Error('Página de links no encontrada');
  await db
    .update(linkPages)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(linkPages.id, existing.id));
  revalidateLinkPage(businessId, business.slug);
  return { success: true };
}

export async function addLinkAction(businessId: string, input: LinkItemInput) {
  const business = await verifyOwnership(businessId);
  const data = linkItemSchema.parse(input);
  const [page] = await db
    .select({ id: linkPages.id })
    .from(linkPages)
    .where(eq(linkPages.businessId, businessId))
    .limit(1);
  if (!page) throw new Error('Página de links no encontrada');
  const existingLinks = await db
    .select({ sortOrder: linkPageLinks.sortOrder })
    .from(linkPageLinks)
    .where(eq(linkPageLinks.linkPageId, page.id))
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
  revalidateLinkPage(businessId, business.slug);
  return { success: true, link: created };
}

export async function updateLinkAction(businessId: string, linkId: string, input: Partial<LinkItemInput>) {
  const business = await verifyOwnership(businessId);
  const [link] = await db
    .select({ id: linkPageLinks.id, linkPageId: linkPageLinks.linkPageId })
    .from(linkPageLinks)
    .where(eq(linkPageLinks.id, linkId))
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
    .set({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.url !== undefined && { url: input.url }),
      ...(input.linkType !== undefined && { linkType: input.linkType }),
      ...(input.iconEmoji !== undefined && { iconEmoji: input.iconEmoji || null }),
      ...(input.iconImageUrl !== undefined && { iconImageUrl: input.iconImageUrl || null }),
      ...(input.thumbnailUrl !== undefined && { thumbnailUrl: input.thumbnailUrl || null }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      updatedAt: new Date(),
    })
    .where(eq(linkPageLinks.id, linkId));
  revalidateLinkPage(businessId, business.slug);
  return { success: true };
}

export async function deleteLinkAction(businessId: string, linkId: string) {
  const business = await verifyOwnership(businessId);
  const [link] = await db
    .select({ linkPageId: linkPageLinks.linkPageId })
    .from(linkPageLinks)
    .where(eq(linkPageLinks.id, linkId))
    .limit(1);
  if (!link) throw new Error('Link no encontrado');
  const [page] = await db
    .select({ businessId: linkPages.businessId })
    .from(linkPages)
    .where(eq(linkPages.id, link.linkPageId))
    .limit(1);
  if (!page || page.businessId !== businessId) throw new Error('No autorizado');
  await db.delete(linkPageLinks).where(eq(linkPageLinks.id, linkId));
  revalidateLinkPage(businessId, business.slug);
  return { success: true };
}

export async function reorderLinksAction(businessId: string, orderedIds: string[]) {
  const business = await verifyOwnership(businessId);
  await Promise.all(
    orderedIds.map((id, index) =>
      db.update(linkPageLinks).set({ sortOrder: index, updatedAt: new Date() }).where(eq(linkPageLinks.id, id))
    )
  );
  revalidateLinkPage(businessId, business.slug);
  return { success: true };
}

export async function toggleLinkActiveAction(businessId: string, linkId: string, isActive: boolean) {
  return updateLinkAction(businessId, linkId, { isActive });
}

export async function seedSocialLinksAction(businessId: string) {
  const business = await verifyOwnership(businessId);
  const [biz] = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
  if (!biz) throw new Error('Negocio no encontrado');
  const [page] = await db
    .select({ id: linkPages.id })
    .from(linkPages)
    .where(eq(linkPages.businessId, businessId))
    .limit(1);
  if (!page) throw new Error('Página de links no encontrada');

  type SocialEntry = { type: string; url: string | null; label: string; emoji: string };
  const socialMap: SocialEntry[] = [
    { type: 'instagram', url: biz.instagramUrl, label: 'Instagram', emoji: '📸' },
    { type: 'facebook', url: biz.facebookUrl, label: 'Facebook', emoji: '📘' },
    { type: 'tiktok', url: biz.tiktokUrl, label: 'TikTok', emoji: '🎵' },
    { type: 'twitter', url: biz.twitterUrl, label: 'Twitter / X', emoji: '🐦' },
    { type: 'youtube', url: biz.youtubeUrl, label: 'YouTube', emoji: '▶️' },
    {
      type: 'whatsapp',
      url: biz.whatsappNumber ? `https://wa.me/${biz.whatsappNumber.replace(/\D/g, '')}` : null,
      label: 'WhatsApp',
      emoji: '💬',
    },
    { type: 'email', url: biz.email ? `mailto:${biz.email}` : null, label: 'Correo', emoji: '✉️' },
    { type: 'phone', url: biz.phone ? `tel:${biz.phone}` : null, label: 'Teléfono', emoji: '📞' },
  ];

  const toInsert = socialMap.filter((s) => Boolean(s.url));
  if (toInsert.length === 0) return { success: true, count: 0 };

  type ValidLinkType = (typeof linkPageLinks.$inferInsert)['linkType'];
  for (let i = 0; i < toInsert.length; i++) {
    const item = toInsert[i]!;
    await db.insert(linkPageLinks).values({
      linkPageId: page.id,
      title: item.label,
      url: item.url!,
      linkType: item.type as ValidLinkType,
      iconEmoji: item.emoji,
      isActive: true,
      sortOrder: i,
    });
  }

  revalidateLinkPage(businessId, business.slug);
  return { success: true, count: toInsert.length };
}

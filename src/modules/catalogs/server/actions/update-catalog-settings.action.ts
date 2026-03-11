'use server';

import { eq, and, asc } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { catalogs, products, businesses, categories, productImages, catalogSettings } from '@/db/schema';

type FontOption = 'inter' | 'playfair' | 'dm-sans' | 'poppins' | 'roboto' | 'space-grotesk' | 'outfit';
type CardStyleOption = 'default' | 'minimal' | 'bordered' | 'shadow';
type LayoutOption = 'grid' | 'list' | 'magazine';
type HeroStyleOption = 'centered' | 'split' | 'banner' | 'minimal';
type CategoriesStyleOption = 'tabs' | 'pills' | 'cards';
type ThemePreset = 'light' | 'dark' | 'elegant' | 'vibrant' | 'ocean' | 'custom';
type CtaAction = 'scroll' | 'link' | 'whatsapp' | 'catalog';

export type CatalogSettingsInput = {
  themePreset?: ThemePreset;
  darkMode?: boolean;
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textColor?: string;
  font?: FontOption;
  roundedCorners?: boolean;
  borderRadius?: number;
  cardStyle?: CardStyleOption;
  borderColor?: string;
  layout?: LayoutOption;
  gridColumns?: number;
  showPrices?: boolean;
  showStock?: boolean;
  announcementEnabled?: boolean;
  announcementText?: string | null;
  announcementBgColor?: string;
  announcementTextColor?: string;
  announcementLink?: string | null;
  announcementDismissable?: boolean;
  announcementIcon?: string | null;
  heroEnabled?: boolean;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroImageUrl?: string | null;
  heroBadgeText?: string | null;
  heroBadgeIcon?: string | null;
  heroCtaPrimaryText?: string | null;
  heroCtaPrimaryAction?: CtaAction;
  heroCtaPrimaryLink?: string | null;
  heroCtaSecondaryText?: string | null;
  heroCtaSecondaryAction?: CtaAction;
  heroCtaSecondaryLink?: string | null;
  heroStyle?: HeroStyleOption;
  featuredEnabled?: boolean;
  featuredTitle?: string | null;
  categoriesStyle?: CategoriesStyleOption;
  aboutEnabled?: boolean;
  aboutText?: string | null;
  aboutImageUrl?: string | null;
  socialLinks?: { instagram?: string; facebook?: string; twitter?: string; tiktok?: string; youtube?: string } | null;
  socialInstagram?: string | null;
  socialFacebook?: string | null;
  socialTwitter?: string | null;
  socialTiktok?: string | null;
  socialYoutube?: string | null;
  socialWhatsapp?: string | null;
  socialEmail?: string | null;
  socialPhone?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImageUrl?: string | null;
  seoCanonicalUrl?: string | null;
  seoKeywords?: string | null;
  faviconUrl?: string | null;
};

export async function updateCatalogSettingsAction(catalogId: string, values: CatalogSettingsInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const [catalog] = await db.select().from(catalogs).where(eq(catalogs.id, catalogId)).limit(1);
    if (!catalog) return { error: 'Catálogo no encontrado' };

    const [business] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(and(eq(businesses.id, catalog.businessId), eq(businesses.userId, session.user.id)))
      .limit(1);

    if (!business) return { error: 'No autorizado' };

    const [existing] = await db
      .select({ id: catalogSettings.id })
      .from(catalogSettings)
      .where(eq(catalogSettings.catalogId, catalogId))
      .limit(1);

    if (existing) {
      await db.update(catalogSettings).set(values).where(eq(catalogSettings.catalogId, catalogId));
    } else {
      await db.insert(catalogSettings).values({ catalogId, ...values });
    }

    return { success: true };
  } catch {
    return { error: 'Ocurrió un error al guardar la configuración.' };
  }
}

export async function getCatalogSettingsForBuilder(catalogId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado', data: null };

    const [catalog] = await db.select().from(catalogs).where(eq(catalogs.id, catalogId)).limit(1);
    if (!catalog) return { error: 'Catálogo no encontrado', data: null };

    const [business] = await db
      .select()
      .from(businesses)
      .where(and(eq(businesses.id, catalog.businessId), eq(businesses.userId, session.user.id)))
      .limit(1);

    if (!business) return { error: 'No autorizado', data: null };

    const [settings, cats, prods] = await Promise.all([
      db.select().from(catalogSettings).where(eq(catalogSettings.catalogId, catalogId)).limit(1),
      db
        .select()
        .from(categories)
        .where(and(eq(categories.catalogId, catalogId), eq(categories.isActive, true)))
        .orderBy(asc(categories.sortOrder)),
      db
        .select()
        .from(products)
        .where(and(eq(products.catalogId, catalogId), eq(products.status, 'active')))
        .orderBy(asc(products.sortOrder))
        .limit(12),
    ]);

    const productIds = prods.map((p) => p.id);
    const images =
      productIds.length > 0
        ? await db
            .select()
            .from(productImages)
            .where(and(...productIds.map((pid) => eq(productImages.productId, pid))))
        : [];

    const imageMap = new Map<string, string>();
    for (const img of images) {
      if (!imageMap.has(img.productId)) imageMap.set(img.productId, img.url);
    }

    const previewProducts = prods.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      imageUrl: imageMap.get(p.id) ?? null,
      isFeatured: p.isFeatured,
      stock: p.stock,
    }));

    return {
      data: {
        settings: settings[0] ?? null,
        businessSlug: business.slug,
        catalogName: catalog.name,
        business: {
          name: business.name,
          slug: business.slug,
          description: business.description,
          logoUrl: business.logoUrl,
          phone: business.phone,
          whatsappNumber: business.whatsappNumber,
          email: business.email,
          address: business.address,
        },
        categories: cats.map((c) => ({ id: c.id, name: c.name })),
        products: previewProducts,
      },
    };
  } catch {
    return { error: 'Ocurrió un error.', data: null };
  }
}

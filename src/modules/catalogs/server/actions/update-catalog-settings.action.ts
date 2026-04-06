'use server';

import { eq, and, asc, inArray } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { revalidateCatalogSettingsCache } from '@/lib/cache-revalidation';
import { brands, catalogs, products, businesses, categories, productImages, catalogSettings } from '@/db/schema';

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
  viewMode?: 'default' | 'restaurant' | 'services' | 'products' | 'experiences';
  showPrices?: boolean;
  showStock?: boolean;
  headerTitle?: string | null;
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
  showFloatingSocials?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImageUrl?: string | null;
  seoCanonicalUrl?: string | null;
  seoKeywords?: string | null;
  faviconUrl?: string | null;
  googleAnalyticsId?: string | null;
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

    revalidateCatalogSettingsCache(catalogId);

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

    const [settings, cats, prods, businessCatalogs] = await Promise.all([
      db.select().from(catalogSettings).where(eq(catalogSettings.catalogId, catalogId)).limit(1),
      db
        .select()
        .from(categories)
        .where(and(eq(categories.businessId, business.id), eq(categories.isActive, true)))
        .orderBy(asc(categories.sortOrder)),
      db
        .select()
        .from(products)
        .where(and(eq(products.businessId, business.id), eq(products.status, 'active')))
        .orderBy(asc(products.sortOrder))
        .limit(20),
      db
        .select()
        .from(catalogs)
        .where(and(eq(catalogs.businessId, business.id), eq(catalogs.isActive, true)))
        .orderBy(asc(catalogs.sortOrder)),
    ]);

    const productIds = prods.map((p) => p.id);
    const images =
      productIds.length > 0
        ? await db.select().from(productImages).where(inArray(productImages.productId, productIds))
        : [];

    const imageMap = new Map<string, string>();
    for (const img of images) {
      if (!imageMap.has(img.productId)) imageMap.set(img.productId, img.url);
    }

    // Fetch brand names
    const brandIds = [...new Set(prods.map((p) => p.brandId).filter(Boolean))] as string[];
    const brandMap = new Map<string, string>();
    if (brandIds.length > 0) {
      const brandRows = await db
        .select({ id: brands.id, name: brands.name })
        .from(brands)
        .where(inArray(brands.id, brandIds));
      for (const b of brandRows) brandMap.set(b.id, b.name);
    }

    const previewProducts = prods.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      imageUrl: imageMap.get(p.id) ?? null,
      isFeatured: p.isFeatured,
      stock: p.stock,
      trackInventory: p.trackInventory,
      brandName: p.brandId ? (brandMap.get(p.brandId) ?? null) : null,
      categoryId: p.categoryId,
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
          currency: business.currency,
          instagramUrl: business.instagramUrl,
          facebookUrl: business.facebookUrl,
          twitterUrl: business.twitterUrl,
          tiktokUrl: business.tiktokUrl,
          youtubeUrl: business.youtubeUrl,
        },
        categories: cats.map((c) => ({ id: c.id, name: c.name })),
        products: previewProducts,
        catalogs: businessCatalogs.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          imageUrl: c.imageUrl,
        })),
      },
    };
  } catch {
    return { error: 'Ocurrió un error.', data: null };
  }
}

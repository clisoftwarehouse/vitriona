import type { AdapterAccountType } from 'next-auth/adapters';
import { text, jsonb, integer, boolean, numeric, pgTable, timestamp, primaryKey } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique().notNull(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  password: text('password'),
  role: text('role', { enum: ['user', 'admin'] })
    .notNull()
    .default('user'),
  phone: text('phone'),
  timezone: text('timezone').default('America/Santo_Domingo'),
  locale: text('locale', { enum: ['es', 'en', 'pt'] }).default('es'),
  avatarUrl: text('avatar_url'),
  onboardingDone: boolean('onboarding_done').notNull().default(false),
  resetPasswordToken: text('reset_password_token'),
  resetPasswordTokenExpiry: timestamp('reset_password_token_expiry', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const userPreferences = pgTable('user_preferences', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  theme: text('theme', { enum: ['light', 'dark', 'system'] })
    .notNull()
    .default('system'),
  sidebarCollapsed: boolean('sidebar_collapsed').notNull().default(false),
  defaultBusinessId: text('default_business_id').references(() => businesses.id, { onDelete: 'set null' }),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })]
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
);

export const authenticators = pgTable(
  'authenticators',
  {
    credentialID: text('credential_id').notNull().unique(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    providerAccountId: text('provider_account_id').notNull(),
    credentialPublicKey: text('credential_public_key').notNull(),
    counter: integer('counter').notNull(),
    credentialDeviceType: text('credential_device_type').notNull(),
    credentialBackedUp: boolean('credential_backed_up').notNull(),
    transports: text('transports'),
  },
  (authenticator) => [primaryKey({ columns: [authenticator.userId, authenticator.credentialID] })]
);

export const otpTokens = pgTable('otp_tokens', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull(),
  otp: text('otp').notNull(),
  purpose: text('purpose', { enum: ['email_verification', 'password_reset'] }).notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  usedAt: timestamp('used_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const businesses = pgTable('businesses', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  description: text('description'),
  logoUrl: text('logo_url'),
  bannerUrl: text('banner_url'),
  category: text('category', {
    enum: [
      'food',
      'jewelry',
      'clothing',
      'electronics',
      'beauty',
      'home',
      'sports',
      'toys',
      'books',
      'services',
      'other',
    ],
  }),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  whatsappNumber: text('whatsapp_number'),

  // ── Regional ──
  currency: text('currency').notNull().default('USD'),
  timezone: text('timezone').default('America/Santo_Domingo'),
  locale: text('locale', { enum: ['es', 'en', 'pt'] }).default('es'),

  // ── Web & Social ──
  website: text('website'),
  instagramUrl: text('instagram_url'),
  facebookUrl: text('facebook_url'),
  tiktokUrl: text('tiktok_url'),
  twitterUrl: text('twitter_url'),
  youtubeUrl: text('youtube_url'),

  // ── Location ──
  country: text('country'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),

  // ── Fiscal ──
  taxId: text('tax_id'),

  // ── Schedule ──
  businessHours: jsonb('business_hours').$type<Record<string, { open: string; close: string; closed: boolean }>>(),

  isActive: boolean('is_active').notNull().default(true),
  plan: text('plan', { enum: ['free', 'pro', 'business'] })
    .notNull()
    .default('free'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const catalogs = pgTable('catalogs', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  businessId: text('business_id')
    .notNull()
    .references(() => businesses.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug'),
  description: text('description'),
  imageUrl: text('image_url'),
  type: text('type', { enum: ['general', 'seasonal', 'premium', 'services'] })
    .notNull()
    .default('general'),
  sortOrder: integer('sort_order').notNull().default(0),
  isDefault: boolean('is_default').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const catalogSettings = pgTable('catalog_settings', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  catalogId: text('catalog_id')
    .notNull()
    .unique()
    .references(() => catalogs.id, { onDelete: 'cascade' }),

  // ── Theme ──
  themePreset: text('theme_preset', {
    enum: ['light', 'dark', 'elegant', 'vibrant', 'ocean', 'custom'],
  }).default('custom'),
  darkMode: boolean('dark_mode').notNull().default(false),
  primaryColor: text('primary_color').default('#000000'),
  accentColor: text('accent_color').default('#6366f1'),
  backgroundColor: text('background_color').default('#ffffff'),
  surfaceColor: text('surface_color').default('#f9fafb'),
  textColor: text('text_color').default('#111827'),
  font: text('font', {
    enum: ['inter', 'playfair', 'dm-sans', 'poppins', 'roboto', 'space-grotesk', 'outfit'],
  }).default('inter'),
  roundedCorners: boolean('rounded_corners').notNull().default(true),
  borderRadius: integer('border_radius').default(12),
  cardStyle: text('card_style', { enum: ['default', 'minimal', 'bordered', 'shadow'] }).default('default'),

  borderColor: text('border_color').default('#e5e7eb'),

  // ── Layout ──
  layout: text('layout', { enum: ['grid', 'list', 'magazine'] }).default('grid'),
  gridColumns: integer('grid_columns').default(4),
  showPrices: boolean('show_prices').notNull().default(true),
  showStock: boolean('show_stock').notNull().default(false),

  // ── Announcement Bar ──
  announcementEnabled: boolean('announcement_enabled').notNull().default(false),
  announcementText: text('announcement_text'),
  announcementBgColor: text('announcement_bg_color').default('#000000'),
  announcementTextColor: text('announcement_text_color').default('#ffffff'),

  // ── Announcement Enhancements ──
  announcementLink: text('announcement_link'),
  announcementDismissable: boolean('announcement_dismissable').notNull().default(false),
  announcementIcon: text('announcement_icon'),

  // ── Hero Section ──
  heroEnabled: boolean('hero_enabled').notNull().default(true),
  heroTitle: text('hero_title'),
  heroSubtitle: text('hero_subtitle'),
  heroImageUrl: text('hero_image_url'),
  heroBadgeText: text('hero_badge_text'),
  heroBadgeIcon: text('hero_badge_icon').default('sparkles'),
  heroCtaPrimaryText: text('hero_cta_primary_text').default('Ver productos'),
  heroCtaPrimaryLink: text('hero_cta_primary_link'),
  heroCtaPrimaryAction: text('hero_cta_primary_action', {
    enum: ['scroll', 'link', 'whatsapp', 'catalog'],
  }).default('scroll'),
  heroCtaSecondaryText: text('hero_cta_secondary_text'),
  heroCtaSecondaryLink: text('hero_cta_secondary_link'),
  heroCtaSecondaryAction: text('hero_cta_secondary_action', {
    enum: ['scroll', 'link', 'whatsapp', 'catalog'],
  }).default('link'),
  heroStyle: text('hero_style', { enum: ['centered', 'split', 'banner', 'minimal'] }).default('centered'),

  // ── Featured Section ──
  featuredEnabled: boolean('featured_enabled').notNull().default(true),
  featuredTitle: text('featured_title').default('Productos destacados'),

  // ── Categories Section ──
  categoriesStyle: text('categories_style', { enum: ['tabs', 'pills', 'cards'] }).default('tabs'),

  // ── About Section ──
  aboutEnabled: boolean('about_enabled').notNull().default(false),
  aboutText: text('about_text'),
  aboutImageUrl: text('about_image_url'),

  // ── Social & Contact ──
  contactInfo: jsonb('contact_info'),
  socialLinks: jsonb('social_links').$type<{
    instagram?: string;
    facebook?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
  }>(),
  socialInstagram: text('social_instagram'),
  socialFacebook: text('social_facebook'),
  socialTwitter: text('social_twitter'),
  socialTiktok: text('social_tiktok'),
  socialYoutube: text('social_youtube'),
  socialWhatsapp: text('social_whatsapp'),
  socialEmail: text('social_email'),
  socialPhone: text('social_phone'),

  // ── SEO ──
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  ogImageUrl: text('og_image_url'),
  seoCanonicalUrl: text('seo_canonical_url'),
  seoKeywords: text('seo_keywords'),
  faviconUrl: text('favicon_url'),
});

export const customSections = pgTable('custom_sections', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  catalogSettingsId: text('catalog_settings_id')
    .notNull()
    .references(() => catalogSettings.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: ['info', 'banner', 'promo', 'products_by_category', 'gallery', 'testimonials'],
  }).notNull(),
  title: text('title'),
  subtitle: text('subtitle'),
  content: jsonb('content'),
  imageUrl: text('image_url'),
  backgroundColor: text('background_color'),
  textColor: text('text_color'),
  sortOrder: integer('sort_order').notNull().default(0),
  isEnabled: boolean('is_enabled').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

// ── Brands ──

export const brands = pgTable('brands', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  businessId: text('business_id')
    .notNull()
    .references(() => businesses.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  logoUrl: text('logo_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const categories = pgTable('categories', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  businessId: text('business_id')
    .notNull()
    .references(() => businesses.id, { onDelete: 'cascade' }),
  catalogId: text('catalog_id').references(() => catalogs.id, { onDelete: 'set null' }),
  parentId: text('parent_id'),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const catalogProducts = pgTable(
  'catalog_products',
  {
    catalogId: text('catalog_id')
      .notNull()
      .references(() => catalogs.id, { onDelete: 'cascade' }),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.catalogId, t.productId] })]
);

export const products = pgTable('products', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  businessId: text('business_id')
    .notNull()
    .references(() => businesses.id, { onDelete: 'cascade' }),
  catalogId: text('catalog_id').references(() => catalogs.id, { onDelete: 'set null' }),
  categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
  brandId: text('brand_id').references(() => brands.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0'),
  compareAtPrice: numeric('compare_at_price', { precision: 10, scale: 2 }),
  sku: text('sku'),
  stock: integer('stock').default(0),
  status: text('status', { enum: ['active', 'inactive', 'out_of_stock'] })
    .notNull()
    .default('active'),
  type: text('type', { enum: ['product', 'service'] })
    .notNull()
    .default('product'),
  weight: numeric('weight', { precision: 10, scale: 2 }),
  dimensions: jsonb('dimensions').$type<{ length?: number; width?: number; height?: number; unit?: string }>(),
  minStock: integer('min_stock').default(0),
  trackInventory: boolean('track_inventory').notNull().default(true),
  tags: text('tags').array(),
  characteristics: jsonb('characteristics').$type<{ name: string; value: string }[]>(),
  isFeatured: boolean('is_featured').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

// ── Product Attributes (definitions per business) ──

export const productAttributes = pgTable('product_attributes', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  businessId: text('business_id')
    .notNull()
    .references(() => businesses.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  type: text('type', { enum: ['text', 'number', 'select', 'color', 'boolean'] })
    .notNull()
    .default('text'),
  options: jsonb('options').$type<string[]>(),
  isRequired: boolean('is_required').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

// ── Product Attribute Values (per product) ──

export const productAttributeValues = pgTable('product_attribute_values', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  attributeId: text('attribute_id')
    .notNull()
    .references(() => productAttributes.id, { onDelete: 'cascade' }),
  value: text('value').notNull(),
});

// ── Services ──

export const services = pgTable('services', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  catalogId: text('catalog_id')
    .notNull()
    .references(() => catalogs.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0'),
  durationMinutes: integer('duration_minutes'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

// ── Inventory Movements ──

export const inventoryMovements = pgTable('inventory_movements', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['in', 'out', 'adjustment', 'order'] }).notNull(),
  quantity: integer('quantity').notNull(),
  reason: text('reason'),
  referenceId: text('reference_id'),
  previousStock: integer('previous_stock').notNull(),
  newStock: integer('new_stock').notNull(),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const chatbotConfigs = pgTable('chatbot_configs', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  businessId: text('business_id')
    .notNull()
    .unique()
    .references(() => businesses.id, { onDelete: 'cascade' }),
  botName: text('bot_name').notNull().default('Asistente Virtual'),
  botSubtitle: text('bot_subtitle'),
  welcomeMessage: text('welcome_message').default('¡Hola! ¿En qué puedo ayudarte?'),
  errorMessage: text('error_message').default(
    'Lo siento, hubo un problema de conexión. Por favor, intenta de nuevo en unos momentos.'
  ),
  systemPrompt: text('system_prompt'),
  businessInfo: jsonb('business_info'),
  faqs: jsonb('faqs').$type<string[]>().default([]),
  isEnabled: boolean('is_enabled').notNull().default(false),

  // ── Personality ──
  personality: text('personality'),
  tone: text('tone', { enum: ['professional', 'friendly', 'casual', 'formal'] })
    .notNull()
    .default('professional'),
  language: text('language').notNull().default('es'),

  // ── Capabilities ──
  autoAccessCatalog: boolean('auto_access_catalog').notNull().default(true),
  orderEnabled: boolean('order_enabled').notNull().default(false),
  maxTokens: integer('max_tokens').notNull().default(1024),
  calendarEnabled: boolean('calendar_enabled').notNull().default(false),
  googleCalendarId: text('google_calendar_id'),
  calendarTimezone: text('calendar_timezone').notNull().default('America/Santo_Domingo'),
  slotDurationMode: text('slot_duration_mode', { enum: ['fixed', 'per_service'] })
    .notNull()
    .default('fixed'),
  slotDurationMinutes: integer('slot_duration_minutes').notNull().default(60),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const chatbotKnowledgeEntries = pgTable('chatbot_knowledge_entries', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  chatbotConfigId: text('chatbot_config_id')
    .notNull()
    .references(() => chatbotConfigs.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  value: text('value').notNull(),
  category: text('category', {
    enum: ['general', 'envios', 'pagos', 'productos', 'servicios', 'politicas', 'otro'],
  }).default('general'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const chatbotKnowledgeFiles = pgTable('chatbot_knowledge_files', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  chatbotConfigId: text('chatbot_config_id')
    .notNull()
    .references(() => chatbotConfigs.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  extractedText: text('extracted_text'),
  status: text('status', { enum: ['processing', 'ready', 'error'] })
    .notNull()
    .default('processing'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const orders = pgTable('orders', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  businessId: text('business_id')
    .notNull()
    .references(() => businesses.id, { onDelete: 'cascade' }),
  catalogId: text('catalog_id')
    .notNull()
    .references(() => catalogs.id, { onDelete: 'cascade' }),
  orderNumber: text('order_number').notNull(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone'),
  customerEmail: text('customer_email'),
  customerNotes: text('customer_notes'),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull().default('0'),
  discount: numeric('discount', { precision: 10, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull().default('0'),
  couponId: text('coupon_id').references(() => coupons.id, { onDelete: 'set null' }),
  couponCode: text('coupon_code'),
  paymentMethodId: text('payment_method_id').references(() => paymentMethods.id, { onDelete: 'set null' }),
  paymentMethodName: text('payment_method_name'),
  paymentDetails: jsonb('payment_details'),
  status: text('status', {
    enum: ['pending_payment', 'payment_verified', 'preparing', 'shipped', 'delivered', 'cancelled'],
  })
    .notNull()
    .default('pending_payment'),
  checkoutType: text('checkout_type', { enum: ['whatsapp', 'internal'] })
    .notNull()
    .default('whatsapp'),
  inventoryDeducted: boolean('inventory_deducted').notNull().default(false),
  cancelledAt: timestamp('cancelled_at', { mode: 'date' }),
  cancelReason: text('cancel_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const orderStatusHistory = pgTable('order_status_history', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  fromStatus: text('from_status'),
  toStatus: text('to_status').notNull(),
  changedBy: text('changed_by').references(() => users.id, { onDelete: 'set null' }),
  note: text('note'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id').references(() => products.id, { onDelete: 'set null' }),
  variantId: text('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
  productName: text('product_name').notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
});

export const productImages = pgTable('product_images', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  variantId: text('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
  url: text('url').notNull(),
  alt: text('alt'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

// ── Product Variants ──

export const productVariants = pgTable('product_variants', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sku: text('sku'),
  price: numeric('price', { precision: 10, scale: 2 }),
  stock: integer('stock').notNull().default(0),
  imageUrl: text('image_url'),
  options: jsonb('options').$type<Record<string, string>>().notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

// ── Product Reviews ──

export const productReviews = pgTable('product_reviews', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  businessId: text('business_id')
    .notNull()
    .references(() => businesses.id, { onDelete: 'cascade' }),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email'),
  rating: integer('rating').notNull(),
  title: text('title'),
  comment: text('comment'),
  isApproved: boolean('is_approved').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

// ── Coupons ──

// ── Payment Methods ──

export const paymentMethods = pgTable('payment_methods', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  businessId: text('business_id')
    .notNull()
    .references(() => businesses.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  instructions: text('instructions'),
  fields: jsonb('fields').$type<{ label: string; value: string }[]>().notNull().default([]),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const coupons = pgTable('coupons', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  businessId: text('business_id')
    .notNull()
    .references(() => businesses.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  description: text('description'),
  discountType: text('discount_type', { enum: ['percentage', 'fixed'] })
    .notNull()
    .default('percentage'),
  discountValue: numeric('discount_value', { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: numeric('min_order_amount', { precision: 10, scale: 2 }),
  maxDiscount: numeric('max_discount', { precision: 10, scale: 2 }),
  usageLimit: integer('usage_limit'),
  usageCount: integer('usage_count').notNull().default(0),
  startsAt: timestamp('starts_at', { mode: 'date' }),
  expiresAt: timestamp('expires_at', { mode: 'date' }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

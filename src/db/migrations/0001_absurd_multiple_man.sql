CREATE TABLE "catalog_products" (
	"catalog_id" text NOT NULL,
	"product_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_products_catalog_id_product_id_pk" PRIMARY KEY("catalog_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "chatbot_knowledge_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"chatbot_config_id" text NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"category" text DEFAULT 'general',
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chatbot_knowledge_files" (
	"id" text PRIMARY KEY NOT NULL,
	"chatbot_config_id" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"extracted_text" text,
	"status" text DEFAULT 'processing' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_sections" (
	"id" text PRIMARY KEY NOT NULL,
	"catalog_settings_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text,
	"subtitle" text,
	"content" jsonb,
	"image_url" text,
	"background_color" text,
	"text_color" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"type" text NOT NULL,
	"quantity" integer NOT NULL,
	"reason" text,
	"reference_id" text,
	"previous_stock" integer NOT NULL,
	"new_stock" integer NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"product_id" text,
	"product_name" text NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"changed_by" text,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"catalog_id" text NOT NULL,
	"order_number" text NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text,
	"customer_email" text,
	"customer_notes" text,
	"subtotal" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"checkout_type" text DEFAULT 'whatsapp' NOT NULL,
	"inventory_deducted" boolean DEFAULT false NOT NULL,
	"cancelled_at" timestamp,
	"cancel_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_attribute_values" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"attribute_id" text NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_attributes" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" text DEFAULT 'text' NOT NULL,
	"options" jsonb,
	"is_required" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" text PRIMARY KEY NOT NULL,
	"catalog_id" text NOT NULL,
	"category_id" text,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"duration_minutes" integer,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"theme" text DEFAULT 'system' NOT NULL,
	"sidebar_collapsed" boolean DEFAULT false NOT NULL,
	"default_business_id" text,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "chatbot_configs" RENAME COLUMN "webhook_url" TO "personality";--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT "categories_catalog_id_catalogs_id_fk";
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_catalog_id_catalogs_id_fk";
--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "catalog_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "catalog_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "currency" text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "timezone" text DEFAULT 'America/Santo_Domingo';--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "locale" text DEFAULT 'es';--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "instagram_url" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "facebook_url" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "tiktok_url" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "twitter_url" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "youtube_url" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "zip_code" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "tax_id" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "business_hours" jsonb;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "theme_preset" text DEFAULT 'custom';--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "dark_mode" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "background_color" text DEFAULT '#ffffff';--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "surface_color" text DEFAULT '#f9fafb';--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "text_color" text DEFAULT '#111827';--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "rounded_corners" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "border_radius" integer DEFAULT 12;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "card_style" text DEFAULT 'default';--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "border_color" text DEFAULT '#e5e7eb';--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "grid_columns" integer DEFAULT 4;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "announcement_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "announcement_text" text;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "announcement_bg_color" text DEFAULT '#000000';--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "announcement_text_color" text DEFAULT '#ffffff';--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "announcement_link" text;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "announcement_dismissable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "announcement_icon" text;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "hero_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "hero_image_url" text;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "hero_badge_text" text;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "hero_badge_icon" text DEFAULT 'sparkles';--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "hero_cta_primary_text" text DEFAULT 'Ver productos';--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "hero_cta_primary_link" text;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "hero_cta_primary_action" text DEFAULT 'scroll';--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "hero_cta_secondary_text" text;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "hero_cta_secondary_link" text;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "hero_cta_secondary_action" text DEFAULT 'link';--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "hero_style" text DEFAULT 'centered';--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "featured_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "featured_title" text DEFAULT 'Productos destacados';--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "categories_style" text DEFAULT 'tabs';--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "about_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "about_image_url" text;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "social_links" jsonb;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "social_instagram" text;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "social_facebook" text;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "social_twitter" text;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "social_tiktok" text;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "social_youtube" text;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "social_whatsapp" text;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "social_email" text;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "social_phone" text;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "og_image_url" text;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "seo_canonical_url" text;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "seo_keywords" text;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "favicon_url" text;--> statement-breakpoint
ALTER TABLE "catalogs" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "catalogs" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "catalogs" ADD COLUMN "type" text DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE "catalogs" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "business_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "chatbot_configs" ADD COLUMN "tone" text DEFAULT 'professional' NOT NULL;--> statement-breakpoint
ALTER TABLE "chatbot_configs" ADD COLUMN "language" text DEFAULT 'es' NOT NULL;--> statement-breakpoint
ALTER TABLE "chatbot_configs" ADD COLUMN "auto_access_catalog" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "chatbot_configs" ADD COLUMN "order_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "chatbot_configs" ADD COLUMN "max_tokens" integer DEFAULT 1024 NOT NULL;--> statement-breakpoint
ALTER TABLE "chatbot_configs" ADD COLUMN "calendar_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "chatbot_configs" ADD COLUMN "google_calendar_id" text;--> statement-breakpoint
ALTER TABLE "chatbot_configs" ADD COLUMN "calendar_timezone" text DEFAULT 'America/Santo_Domingo' NOT NULL;--> statement-breakpoint
ALTER TABLE "chatbot_configs" ADD COLUMN "slot_duration_mode" text DEFAULT 'fixed' NOT NULL;--> statement-breakpoint
ALTER TABLE "chatbot_configs" ADD COLUMN "slot_duration_minutes" integer DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "business_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "type" text DEFAULT 'product' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "weight" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "dimensions" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "min_stock" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "track_inventory" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tags" text[];--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "characteristics" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "timezone" text DEFAULT 'America/Santo_Domingo';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "locale" text DEFAULT 'es';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_done" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "catalog_products" ADD CONSTRAINT "catalog_products_catalog_id_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_products" ADD CONSTRAINT "catalog_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatbot_knowledge_entries" ADD CONSTRAINT "chatbot_knowledge_entries_chatbot_config_id_chatbot_configs_id_fk" FOREIGN KEY ("chatbot_config_id") REFERENCES "public"."chatbot_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatbot_knowledge_files" ADD CONSTRAINT "chatbot_knowledge_files_chatbot_config_id_chatbot_configs_id_fk" FOREIGN KEY ("chatbot_config_id") REFERENCES "public"."chatbot_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_sections" ADD CONSTRAINT "custom_sections_catalog_settings_id_catalog_settings_id_fk" FOREIGN KEY ("catalog_settings_id") REFERENCES "public"."catalog_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_catalog_id_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_attribute_id_product_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."product_attributes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_catalog_id_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_default_business_id_businesses_id_fk" FOREIGN KEY ("default_business_id") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_catalog_id_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalogs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_catalog_id_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalogs"("id") ON DELETE set null ON UPDATE no action;
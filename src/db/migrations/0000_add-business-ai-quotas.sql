CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "authenticators" (
	"credential_id" text NOT NULL,
	"user_id" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"credential_public_key" text NOT NULL,
	"counter" integer NOT NULL,
	"credential_device_type" text NOT NULL,
	"credential_backed_up" boolean NOT NULL,
	"transports" text,
	CONSTRAINT "authenticators_user_id_credential_id_pk" PRIMARY KEY("user_id","credential_id"),
	CONSTRAINT "authenticators_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_ai_quotas" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"ai_plan_type" text NOT NULL,
	"ai_messages_used" integer DEFAULT 0 NOT NULL,
	"ai_messages_limit" integer NOT NULL,
	"billing_cycle_start" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "business_ai_quotas_business_id_unique" UNIQUE("business_id")
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"logo_url" text,
	"banner_url" text,
	"category" text,
	"phone" text,
	"email" text,
	"address" text,
	"whatsapp_number" text,
	"currency" text DEFAULT 'USD' NOT NULL,
	"timezone" text DEFAULT 'America/Santo_Domingo',
	"locale" text DEFAULT 'es',
	"website" text,
	"instagram_url" text,
	"facebook_url" text,
	"tiktok_url" text,
	"twitter_url" text,
	"youtube_url" text,
	"country" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"tax_id" text,
	"business_hours" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "businesses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "catalog_products" (
	"catalog_id" text NOT NULL,
	"product_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_products_catalog_id_product_id_pk" PRIMARY KEY("catalog_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "catalog_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"catalog_id" text NOT NULL,
	"theme_preset" text DEFAULT 'custom',
	"dark_mode" boolean DEFAULT false NOT NULL,
	"primary_color" text DEFAULT '#000000',
	"accent_color" text DEFAULT '#6366f1',
	"background_color" text DEFAULT '#ffffff',
	"surface_color" text DEFAULT '#f9fafb',
	"text_color" text DEFAULT '#111827',
	"font" text DEFAULT 'inter',
	"rounded_corners" boolean DEFAULT true NOT NULL,
	"border_radius" integer DEFAULT 12,
	"card_style" text DEFAULT 'default',
	"border_color" text DEFAULT '#e5e7eb',
	"layout" text DEFAULT 'grid',
	"grid_columns" integer DEFAULT 4,
	"show_prices" boolean DEFAULT true NOT NULL,
	"show_stock" boolean DEFAULT false NOT NULL,
	"announcement_enabled" boolean DEFAULT false NOT NULL,
	"announcement_text" text,
	"announcement_bg_color" text DEFAULT '#000000',
	"announcement_text_color" text DEFAULT '#ffffff',
	"announcement_link" text,
	"announcement_dismissable" boolean DEFAULT false NOT NULL,
	"announcement_icon" text,
	"hero_enabled" boolean DEFAULT true NOT NULL,
	"hero_title" text,
	"hero_subtitle" text,
	"hero_image_url" text,
	"hero_badge_text" text,
	"hero_badge_icon" text DEFAULT 'sparkles',
	"hero_cta_primary_text" text DEFAULT 'Ver productos',
	"hero_cta_primary_link" text,
	"hero_cta_primary_action" text DEFAULT 'scroll',
	"hero_cta_secondary_text" text,
	"hero_cta_secondary_link" text,
	"hero_cta_secondary_action" text DEFAULT 'link',
	"hero_style" text DEFAULT 'centered',
	"featured_enabled" boolean DEFAULT true NOT NULL,
	"featured_title" text DEFAULT 'Productos destacados',
	"categories_style" text DEFAULT 'tabs',
	"about_enabled" boolean DEFAULT false NOT NULL,
	"about_text" text,
	"about_image_url" text,
	"contact_info" jsonb,
	"social_links" jsonb,
	"social_instagram" text,
	"social_facebook" text,
	"social_twitter" text,
	"social_tiktok" text,
	"social_youtube" text,
	"social_whatsapp" text,
	"social_email" text,
	"social_phone" text,
	"seo_title" text,
	"seo_description" text,
	"og_image_url" text,
	"seo_canonical_url" text,
	"seo_keywords" text,
	"favicon_url" text,
	"google_analytics_id" text,
	CONSTRAINT "catalog_settings_catalog_id_unique" UNIQUE("catalog_id")
);
--> statement-breakpoint
CREATE TABLE "catalogs" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"description" text,
	"image_url" text,
	"type" text DEFAULT 'general' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"catalog_id" text,
	"parent_id" text,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"image_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chatbot_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"bot_name" text DEFAULT 'Asistente Virtual' NOT NULL,
	"bot_subtitle" text,
	"welcome_message" text DEFAULT '¡Hola! ¿En qué puedo ayudarte?',
	"error_message" text DEFAULT 'Lo siento, hubo un problema de conexión. Por favor, intenta de nuevo en unos momentos.',
	"system_prompt" text,
	"business_info" jsonb,
	"faqs" jsonb DEFAULT '[]'::jsonb,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"personality" text,
	"tone" text DEFAULT 'professional' NOT NULL,
	"language" text DEFAULT 'es' NOT NULL,
	"auto_access_catalog" boolean DEFAULT true NOT NULL,
	"order_enabled" boolean DEFAULT false NOT NULL,
	"max_tokens" integer DEFAULT 1024 NOT NULL,
	"calendar_enabled" boolean DEFAULT false NOT NULL,
	"google_calendar_id" text,
	"calendar_timezone" text DEFAULT 'America/Santo_Domingo' NOT NULL,
	"slot_duration_mode" text DEFAULT 'fixed' NOT NULL,
	"slot_duration_minutes" integer DEFAULT 60 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chatbot_configs_business_id_unique" UNIQUE("business_id")
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
CREATE TABLE "coupons" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"discount_type" text DEFAULT 'percentage' NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"min_order_amount" numeric(10, 2),
	"max_discount" numeric(10, 2),
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
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
CREATE TABLE "delivery_methods" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"estimated_time" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
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
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"business_id" text,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"href" text,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"product_id" text,
	"variant_id" text,
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
	"discount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"coupon_id" text,
	"coupon_code" text,
	"payment_method_id" text,
	"payment_method_name" text,
	"payment_details" jsonb,
	"delivery_method_id" text,
	"delivery_method_name" text,
	"shipping_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'pending_payment' NOT NULL,
	"checkout_type" text DEFAULT 'whatsapp' NOT NULL,
	"inventory_deducted" boolean DEFAULT false NOT NULL,
	"cancelled_at" timestamp,
	"cancel_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"otp" text NOT NULL,
	"purpose" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"name" text NOT NULL,
	"instructions" text,
	"fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verification_method" text DEFAULT 'phone',
	"verification_label" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
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
CREATE TABLE "product_images" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"variant_id" text,
	"url" text NOT NULL,
	"alt" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"business_id" text NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text,
	"rating" integer NOT NULL,
	"title" text,
	"comment" text,
	"is_approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"name" text NOT NULL,
	"sku" text,
	"price" numeric(10, 2),
	"stock" integer DEFAULT 0 NOT NULL,
	"image_url" text,
	"options" jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"catalog_id" text,
	"category_id" text,
	"brand_id" text,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"compare_at_price" numeric(10, 2),
	"sku" text,
	"stock" integer DEFAULT 0,
	"status" text DEFAULT 'active' NOT NULL,
	"type" text DEFAULT 'product' NOT NULL,
	"weight" numeric(10, 2),
	"dimensions" jsonb,
	"min_stock" integer DEFAULT 0,
	"track_inventory" boolean DEFAULT true NOT NULL,
	"tags" text[],
	"characteristics" jsonb,
	"is_featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL
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
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"password" text,
	"role" text DEFAULT 'user' NOT NULL,
	"phone" text,
	"timezone" text DEFAULT 'America/Santo_Domingo',
	"locale" text DEFAULT 'es',
	"avatar_url" text,
	"onboarding_done" boolean DEFAULT false NOT NULL,
	"reset_password_token" text,
	"reset_password_token_expiry" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticators" ADD CONSTRAINT "authenticators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_ai_quotas" ADD CONSTRAINT "business_ai_quotas_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_products" ADD CONSTRAINT "catalog_products_catalog_id_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_products" ADD CONSTRAINT "catalog_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD CONSTRAINT "catalog_settings_catalog_id_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalogs" ADD CONSTRAINT "catalogs_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_catalog_id_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalogs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatbot_configs" ADD CONSTRAINT "chatbot_configs_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatbot_knowledge_entries" ADD CONSTRAINT "chatbot_knowledge_entries_chatbot_config_id_chatbot_configs_id_fk" FOREIGN KEY ("chatbot_config_id") REFERENCES "public"."chatbot_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatbot_knowledge_files" ADD CONSTRAINT "chatbot_knowledge_files_chatbot_config_id_chatbot_configs_id_fk" FOREIGN KEY ("chatbot_config_id") REFERENCES "public"."chatbot_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_sections" ADD CONSTRAINT "custom_sections_catalog_settings_id_catalog_settings_id_fk" FOREIGN KEY ("catalog_settings_id") REFERENCES "public"."catalog_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD CONSTRAINT "delivery_methods_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_catalog_id_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_method_id_delivery_methods_id_fk" FOREIGN KEY ("delivery_method_id") REFERENCES "public"."delivery_methods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_attribute_id_product_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."product_attributes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_catalog_id_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalogs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_catalog_id_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_default_business_id_businesses_id_fk" FOREIGN KEY ("default_business_id") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;
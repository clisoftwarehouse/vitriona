CREATE TABLE "link_page_links" (
	"id" text PRIMARY KEY NOT NULL,
	"link_page_id" text NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"link_type" text DEFAULT 'custom' NOT NULL,
	"icon_emoji" text,
	"icon_image_url" text,
	"thumbnail_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "link_pages" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"title" text,
	"bio" text,
	"avatar_url" text,
	"use_storefront_theme" boolean DEFAULT false NOT NULL,
	"background_type" text DEFAULT 'color' NOT NULL,
	"background_color" text DEFAULT '#0f0f0f',
	"background_gradient" text DEFAULT 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)',
	"background_image_url" text,
	"background_overlay" boolean DEFAULT false NOT NULL,
	"background_overlay_color" text DEFAULT '#000000',
	"background_overlay_opacity" integer DEFAULT 50,
	"text_color" text DEFAULT '#ffffff',
	"button_style" text DEFAULT 'pill-filled' NOT NULL,
	"button_color" text DEFAULT '#8b1a1a',
	"button_text_color" text DEFAULT '#ffffff',
	"button_radius" integer DEFAULT 999,
	"button_gradient_from" text DEFAULT '#6366f1',
	"button_gradient_to" text DEFAULT '#a855f7',
	"button_gradient_angle" integer DEFAULT 135,
	"font" text DEFAULT 'inter',
	"storefront_link_title" text DEFAULT 'Ver nuestra tienda',
	"storefront_link_enabled" boolean DEFAULT true NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "link_pages_business_id_unique" UNIQUE("business_id")
);
--> statement-breakpoint
ALTER TABLE "businesses" DROP CONSTRAINT "businesses_slug_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "custom_max_products" integer;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "custom_max_visits_per_month" integer;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "custom_max_payment_methods" integer;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "custom_max_delivery_methods" integer;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "custom_limits_note" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "gift_card_redemptions" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "gift_card_redemptions" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "gift_cards" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "gift_cards" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "link_page_links" ADD CONSTRAINT "link_page_links_link_page_id_link_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "public"."link_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_pages" ADD CONSTRAINT "link_pages_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_card_redemptions" ADD CONSTRAINT "gift_card_redemptions_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "businesses_slug_active_unique" ON "businesses" USING btree ("slug") WHERE "businesses"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_active_unique" ON "users" USING btree ("email") WHERE "users"."deleted_at" IS NULL;
CREATE TABLE "bundle_items" (
	"id" text PRIMARY KEY NOT NULL,
	"bundle_product_id" text NOT NULL,
	"item_product_id" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
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
CREATE TABLE "order_bundle_components" (
	"id" text PRIMARY KEY NOT NULL,
	"order_item_id" text NOT NULL,
	"component_product_id" text,
	"component_product_name" text NOT NULL,
	"unit_quantity" integer DEFAULT 1 NOT NULL,
	"total_quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tracks_inventory" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "qr_settings" jsonb;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "applicable_product_ids" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_type" text DEFAULT 'order' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "reservation_date" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "reservation_time" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "bundle_price_mode" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "bundle_custom_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_bundle_product_id_products_id_fk" FOREIGN KEY ("bundle_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_item_product_id_products_id_fk" FOREIGN KEY ("item_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_ai_quotas" ADD CONSTRAINT "business_ai_quotas_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_bundle_components" ADD CONSTRAINT "order_bundle_components_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_bundle_components" ADD CONSTRAINT "order_bundle_components_component_product_id_products_id_fk" FOREIGN KEY ("component_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
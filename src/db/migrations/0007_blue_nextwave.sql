CREATE TABLE "bundle_items" (
	"id" text PRIMARY KEY NOT NULL,
	"bundle_product_id" text NOT NULL,
	"slot_id" text,
	"item_product_id" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"max_quantity" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bundle_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"bundle_product_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"min_items" integer DEFAULT 0 NOT NULL,
	"max_items" integer,
	"min_amount" numeric(10, 2),
	"is_required" boolean DEFAULT false NOT NULL,
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
	"billing_cycle" text,
	"billing_cycle_start" timestamp DEFAULT now() NOT NULL,
	"billing_cycle_end" timestamp,
	"scheduled_ai_plan_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "business_ai_quotas_business_id_unique" UNIQUE("business_id")
);
--> statement-breakpoint
CREATE TABLE "chatbot_activation_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"business_id" text NOT NULL,
	"request_type" text DEFAULT 'new' NOT NULL,
	"ai_plan_type" text NOT NULL,
	"billing_cycle" text NOT NULL,
	"payment_method" text NOT NULL,
	"reference_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"full_name" text NOT NULL,
	"id_number" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"notes" text,
	"token" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "exchange_rates" (
	"id" text PRIMARY KEY NOT NULL,
	"currency" text NOT NULL,
	"rate" numeric(14, 2) NOT NULL,
	"source" text DEFAULT 'BCV' NOT NULL,
	"date" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gift_cards" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"code" text NOT NULL,
	"type" text DEFAULT 'fixed' NOT NULL,
	"initial_value" numeric(10, 2) NOT NULL,
	"current_balance" numeric(10, 2) NOT NULL,
	"applicable_product_ids" jsonb,
	"recipient_name" text,
	"recipient_email" text,
	"sender_name" text,
	"message" text,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"redeemed_at" timestamp,
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
CREATE TABLE "related_products" (
	"product_id" text NOT NULL,
	"related_product_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "related_products_product_id_related_product_id_pk" PRIMARY KEY("product_id","related_product_id")
);
--> statement-breakpoint
CREATE TABLE "upgrade_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"business_id" text NOT NULL,
	"request_type" text DEFAULT 'new' NOT NULL,
	"plan" text NOT NULL,
	"billing_cycle" text NOT NULL,
	"payment_method" text NOT NULL,
	"reference_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"full_name" text NOT NULL,
	"id_number" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"notes" text,
	"token" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "catalog_settings" ALTER COLUMN "grid_columns" SET DEFAULT 3;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "qr_settings" jsonb;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "billing_cycle" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "billing_cycle_end" timestamp;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "scheduled_plan" text;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "view_mode" text DEFAULT 'default';--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "header_title" text;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "logo_size" integer DEFAULT 36;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "show_floating_socials" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "google_analytics_id" text;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "applicable_product_ids" jsonb;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "bundle_selections" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_type" text DEFAULT 'order' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "reservation_date" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "reservation_time" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_method_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_method_name" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_cost" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "bundle_price_mode" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "bundle_selection_mode" text DEFAULT 'fixed';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "bundle_custom_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "bundle_minimum_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_bundle_product_id_products_id_fk" FOREIGN KEY ("bundle_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_slot_id_bundle_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."bundle_slots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_item_product_id_products_id_fk" FOREIGN KEY ("item_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_slots" ADD CONSTRAINT "bundle_slots_bundle_product_id_products_id_fk" FOREIGN KEY ("bundle_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_ai_quotas" ADD CONSTRAINT "business_ai_quotas_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatbot_activation_requests" ADD CONSTRAINT "chatbot_activation_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatbot_activation_requests" ADD CONSTRAINT "chatbot_activation_requests_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD CONSTRAINT "delivery_methods_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_bundle_components" ADD CONSTRAINT "order_bundle_components_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_bundle_components" ADD CONSTRAINT "order_bundle_components_component_product_id_products_id_fk" FOREIGN KEY ("component_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "related_products" ADD CONSTRAINT "related_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "related_products" ADD CONSTRAINT "related_products_related_product_id_products_id_fk" FOREIGN KEY ("related_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upgrade_requests" ADD CONSTRAINT "upgrade_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upgrade_requests" ADD CONSTRAINT "upgrade_requests_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_method_id_delivery_methods_id_fk" FOREIGN KEY ("delivery_method_id") REFERENCES "public"."delivery_methods"("id") ON DELETE set null ON UPDATE no action;
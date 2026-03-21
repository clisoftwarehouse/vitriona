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
ALTER TABLE "order_items" ADD COLUMN "variant_id" text;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;
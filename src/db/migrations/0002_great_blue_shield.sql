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
ALTER TABLE "bundle_items" ADD COLUMN "slot_id" text;--> statement-breakpoint
ALTER TABLE "bundle_items" ADD COLUMN "max_quantity" integer;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "bundle_selections" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "bundle_selection_mode" text DEFAULT 'fixed';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "bundle_minimum_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "bundle_slots" ADD CONSTRAINT "bundle_slots_bundle_product_id_products_id_fk" FOREIGN KEY ("bundle_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_slot_id_bundle_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."bundle_slots"("id") ON DELETE cascade ON UPDATE no action;
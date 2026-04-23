CREATE TABLE "gift_card_redemptions" (
	"id" text PRIMARY KEY NOT NULL,
	"gift_card_id" text NOT NULL,
	"order_id" text,
	"business_id" text NOT NULL,
	"redemption_type" text DEFAULT 'order' NOT NULL,
	"redeemed_by" text,
	"notes" text,
	"amount" numeric(10, 2) NOT NULL,
	"balance_before" numeric(10, 2),
	"balance_after" numeric(10, 2),
	"redeemed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "custom_max_products" integer;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "custom_max_visits_per_month" integer;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "custom_max_payment_methods" integer;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "custom_max_delivery_methods" integer;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "custom_limits_note" text;--> statement-breakpoint
ALTER TABLE "gift_cards" ADD COLUMN "max_discount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "gift_cards" ADD COLUMN "quantity" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "gift_card_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "gift_card_code" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "gift_card_discount" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "gift_card_redemptions" ADD CONSTRAINT "gift_card_redemptions_gift_card_id_gift_cards_id_fk" FOREIGN KEY ("gift_card_id") REFERENCES "public"."gift_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_card_redemptions" ADD CONSTRAINT "gift_card_redemptions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_card_redemptions" ADD CONSTRAINT "gift_card_redemptions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_card_redemptions" ADD CONSTRAINT "gift_card_redemptions_redeemed_by_users_id_fk" FOREIGN KEY ("redeemed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_gift_card_id_gift_cards_id_fk" FOREIGN KEY ("gift_card_id") REFERENCES "public"."gift_cards"("id") ON DELETE set null ON UPDATE no action;
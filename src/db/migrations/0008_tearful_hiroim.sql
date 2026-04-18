CREATE TABLE "exchange_rates" (
	"id" text PRIMARY KEY NOT NULL,
	"currency" text NOT NULL,
	"rate" numeric(14, 2) NOT NULL,
	"source" text DEFAULT 'BCV' NOT NULL,
	"date" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gift_card_redemptions" (
	"id" text PRIMARY KEY NOT NULL,
	"gift_card_id" text NOT NULL,
	"order_id" text NOT NULL,
	"business_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"balance_before" numeric(10, 2),
	"balance_after" numeric(10, 2),
	"redeemed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "catalog_settings" ADD COLUMN "logo_size" integer DEFAULT 36;--> statement-breakpoint
ALTER TABLE "chatbot_activation_requests" ADD COLUMN "amount_ves" numeric(18, 2);--> statement-breakpoint
ALTER TABLE "chatbot_activation_requests" ADD COLUMN "exchange_rate" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "gift_cards" ADD COLUMN "max_discount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "gift_card_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "gift_card_code" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "gift_card_discount" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "upgrade_requests" ADD COLUMN "amount_ves" numeric(18, 2);--> statement-breakpoint
ALTER TABLE "upgrade_requests" ADD COLUMN "exchange_rate" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "gift_card_redemptions" ADD CONSTRAINT "gift_card_redemptions_gift_card_id_gift_cards_id_fk" FOREIGN KEY ("gift_card_id") REFERENCES "public"."gift_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_card_redemptions" ADD CONSTRAINT "gift_card_redemptions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_card_redemptions" ADD CONSTRAINT "gift_card_redemptions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_gift_card_id_gift_cards_id_fk" FOREIGN KEY ("gift_card_id") REFERENCES "public"."gift_cards"("id") ON DELETE set null ON UPDATE no action;
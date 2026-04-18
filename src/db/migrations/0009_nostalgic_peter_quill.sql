ALTER TABLE "gift_card_redemptions" ALTER COLUMN "order_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "gift_card_redemptions" ADD COLUMN "redemption_type" text DEFAULT 'order' NOT NULL;--> statement-breakpoint
ALTER TABLE "gift_card_redemptions" ADD COLUMN "redeemed_by" text;--> statement-breakpoint
ALTER TABLE "gift_card_redemptions" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "gift_card_redemptions" ADD CONSTRAINT "gift_card_redemptions_redeemed_by_users_id_fk" FOREIGN KEY ("redeemed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
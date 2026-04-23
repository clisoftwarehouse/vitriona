ALTER TABLE "businesses" DROP CONSTRAINT "businesses_slug_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
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
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_card_redemptions" ADD CONSTRAINT "gift_card_redemptions_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "businesses_slug_active_unique" ON "businesses" USING btree ("slug") WHERE "businesses"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_active_unique" ON "users" USING btree ("email") WHERE "users"."deleted_at" IS NULL;
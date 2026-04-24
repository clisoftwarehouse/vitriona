ALTER TABLE "link_pages" DROP CONSTRAINT "link_pages_business_id_unique";--> statement-breakpoint
ALTER TABLE "link_page_links" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "link_page_links" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "link_pages" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "link_pages" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "link_page_links" ADD CONSTRAINT "link_page_links_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_pages" ADD CONSTRAINT "link_pages_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "link_page_links_link_page_id_idx" ON "link_page_links" USING btree ("link_page_id");--> statement-breakpoint
CREATE UNIQUE INDEX "link_pages_business_id_active_unique" ON "link_pages" USING btree ("business_id") WHERE "link_pages"."deleted_at" IS NULL;
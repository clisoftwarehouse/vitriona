ALTER TABLE "business_ai_quotas" ADD COLUMN "billing_cycle" text;--> statement-breakpoint
ALTER TABLE "business_ai_quotas" ADD COLUMN "billing_cycle_end" timestamp;--> statement-breakpoint
ALTER TABLE "business_ai_quotas" ADD COLUMN "scheduled_ai_plan_type" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "billing_cycle" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "billing_cycle_end" timestamp;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "scheduled_plan" text;--> statement-breakpoint
ALTER TABLE "chatbot_activation_requests" ADD COLUMN "request_type" text DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE "upgrade_requests" ADD COLUMN "request_type" text DEFAULT 'new' NOT NULL;
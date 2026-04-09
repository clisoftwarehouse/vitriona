-- Add billing fields to businesses
ALTER TABLE "businesses" ADD COLUMN "billing_cycle" text;
ALTER TABLE "businesses" ADD COLUMN "billing_cycle_end" timestamp;
ALTER TABLE "businesses" ADD COLUMN "scheduled_plan" text;

-- Add billing fields to business_ai_quotas
ALTER TABLE "business_ai_quotas" ADD COLUMN "billing_cycle" text;
ALTER TABLE "business_ai_quotas" ADD COLUMN "billing_cycle_end" timestamp;
ALTER TABLE "business_ai_quotas" ADD COLUMN "scheduled_ai_plan_type" text;

-- Add request_type to chatbot_activation_requests
ALTER TABLE "chatbot_activation_requests" ADD COLUMN "request_type" text NOT NULL DEFAULT 'new';

-- Add request_type to upgrade_requests
ALTER TABLE "upgrade_requests" ADD COLUMN "request_type" text NOT NULL DEFAULT 'new';
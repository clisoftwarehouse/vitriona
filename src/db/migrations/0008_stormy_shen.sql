ALTER TABLE "chatbot_activation_requests" ADD COLUMN "amount_ves" numeric(18, 2);--> statement-breakpoint
ALTER TABLE "chatbot_activation_requests" ADD COLUMN "exchange_rate" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "upgrade_requests" ADD COLUMN "amount_ves" numeric(18, 2);--> statement-breakpoint
ALTER TABLE "upgrade_requests" ADD COLUMN "exchange_rate" numeric(14, 2);
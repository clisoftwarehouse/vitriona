CREATE TABLE IF NOT EXISTS "chatbot_activation_requests" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "business_id" text NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
  "ai_plan_type" text NOT NULL,
  "billing_cycle" text NOT NULL,
  "payment_method" text NOT NULL,
  "reference_id" text NOT NULL,
  "amount" numeric(10, 2) NOT NULL,
  "full_name" text NOT NULL,
  "id_number" text NOT NULL,
  "email" text NOT NULL,
  "phone" text,
  "notes" text,
  "token" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
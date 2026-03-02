ALTER TABLE "account" RENAME TO "accounts";--> statement-breakpoint
ALTER TABLE "authenticator" RENAME TO "authenticators";--> statement-breakpoint
ALTER TABLE "otpToken" RENAME TO "otp_tokens";--> statement-breakpoint
ALTER TABLE "session" RENAME TO "sessions";--> statement-breakpoint
ALTER TABLE "user" RENAME TO "users";--> statement-breakpoint
ALTER TABLE "verificationToken" RENAME TO "verification_tokens";--> statement-breakpoint
ALTER TABLE "accounts" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "accounts" RENAME COLUMN "providerAccountId" TO "provider_account_id";--> statement-breakpoint
ALTER TABLE "authenticators" RENAME COLUMN "credentialID" TO "credential_id";--> statement-breakpoint
ALTER TABLE "authenticators" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "authenticators" RENAME COLUMN "providerAccountId" TO "provider_account_id";--> statement-breakpoint
ALTER TABLE "authenticators" RENAME COLUMN "credentialPublicKey" TO "credential_public_key";--> statement-breakpoint
ALTER TABLE "authenticators" RENAME COLUMN "credentialDeviceType" TO "credential_device_type";--> statement-breakpoint
ALTER TABLE "authenticators" RENAME COLUMN "credentialBackedUp" TO "credential_backed_up";--> statement-breakpoint
ALTER TABLE "otp_tokens" RENAME COLUMN "expiresAt" TO "expires_at";--> statement-breakpoint
ALTER TABLE "otp_tokens" RENAME COLUMN "usedAt" TO "used_at";--> statement-breakpoint
ALTER TABLE "otp_tokens" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "sessions" RENAME COLUMN "sessionToken" TO "session_token";--> statement-breakpoint
ALTER TABLE "sessions" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "emailVerified" TO "email_verified";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "resetPasswordToken" TO "reset_password_token";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "resetPasswordTokenExpiry" TO "reset_password_token_expiry";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "authenticators" DROP CONSTRAINT "authenticator_credentialID_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "user_email_unique";--> statement-breakpoint
ALTER TABLE "accounts" DROP CONSTRAINT "account_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "authenticators" DROP CONSTRAINT "authenticator_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "session_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "accounts" DROP CONSTRAINT "account_provider_providerAccountId_pk";--> statement-breakpoint
ALTER TABLE "authenticators" DROP CONSTRAINT "authenticator_userId_credentialID_pk";--> statement-breakpoint
ALTER TABLE "verification_tokens" DROP CONSTRAINT "verificationToken_identifier_token_pk";--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id");--> statement-breakpoint
ALTER TABLE "authenticators" ADD CONSTRAINT "authenticators_user_id_credential_id_pk" PRIMARY KEY("user_id","credential_id");--> statement-breakpoint
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticators" ADD CONSTRAINT "authenticators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticators" ADD CONSTRAINT "authenticators_credential_id_unique" UNIQUE("credential_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");
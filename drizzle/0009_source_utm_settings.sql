ALTER TABLE "sources" ADD COLUMN IF NOT EXISTS "utm_source" text DEFAULT 'hirek.hu' NOT NULL;
--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN IF NOT EXISTS "utm_medium" text DEFAULT 'referral' NOT NULL;
--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN IF NOT EXISTS "utm_campaign" text DEFAULT 'hirek_stream' NOT NULL;

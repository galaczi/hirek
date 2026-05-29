ALTER TABLE "sources" ADD COLUMN IF NOT EXISTS "status_note" text;
--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN IF NOT EXISTS "partner_package" text DEFAULT 'free' NOT NULL;
--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN IF NOT EXISTS "partner_status" text DEFAULT 'none' NOT NULL;
--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN IF NOT EXISTS "traffic_target" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sources_status_idx" ON "sources" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sources_partner_status_idx" ON "sources" USING btree ("partner_status");

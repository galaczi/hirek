ALTER TABLE "click_events" ADD COLUMN IF NOT EXISTS "category_id" integer;
--> statement-breakpoint
ALTER TABLE "click_events" ADD COLUMN IF NOT EXISTS "utm_campaign" text DEFAULT 'hirek_stream' NOT NULL;
--> statement-breakpoint
ALTER TABLE "click_events" ADD COLUMN IF NOT EXISTS "utm_content" text;
--> statement-breakpoint
ALTER TABLE "click_events" ADD COLUMN IF NOT EXISTS "is_bot" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "click_events" ADD COLUMN IF NOT EXISTS "bot_name" text;
--> statement-breakpoint
ALTER TABLE "click_events" ADD COLUMN IF NOT EXISTS "is_unique" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "click_events" ADD CONSTRAINT "click_events_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "click_events_category_idx" ON "click_events" USING btree ("category_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "click_events_campaign_idx" ON "click_events" USING btree ("utm_campaign");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "click_events_bot_idx" ON "click_events" USING btree ("is_bot");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "click_events_unique_idx" ON "click_events" USING btree ("is_unique");

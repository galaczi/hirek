CREATE TABLE IF NOT EXISTS "impression_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer NOT NULL,
	"source_id" integer NOT NULL,
	"category_id" integer,
	"page_path" text,
	"referrer" text,
	"user_agent" text,
	"ip_hash" text,
	"is_bot" boolean DEFAULT false NOT NULL,
	"bot_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "impression_events" ADD CONSTRAINT "impression_events_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "impression_events" ADD CONSTRAINT "impression_events_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "impression_events" ADD CONSTRAINT "impression_events_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "impression_events_article_idx" ON "impression_events" USING btree ("article_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "impression_events_source_idx" ON "impression_events" USING btree ("source_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "impression_events_category_idx" ON "impression_events" USING btree ("category_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "impression_events_created_at_idx" ON "impression_events" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "impression_events_bot_idx" ON "impression_events" USING btree ("is_bot");

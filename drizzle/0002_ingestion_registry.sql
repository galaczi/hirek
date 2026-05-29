CREATE TABLE "source_feeds" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer NOT NULL,
	"category_id" integer,
	"feed_url" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"last_fetched_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "source_feeds" ADD CONSTRAINT "source_feeds_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_feeds" ADD CONSTRAINT "source_feeds_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "source_feeds_feed_url_idx" ON "source_feeds" USING btree ("feed_url");--> statement-breakpoint
CREATE INDEX "source_feeds_source_idx" ON "source_feeds" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "source_feeds_status_idx" ON "source_feeds" USING btree ("status");

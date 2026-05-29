CREATE EXTENSION IF NOT EXISTS pgmq;
--> statement-breakpoint
DO $$
BEGIN
	PERFORM pgmq.create('ingestion');
EXCEPTION
	WHEN duplicate_table THEN NULL;
	WHEN unique_violation THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE "article_category_overrides" (
	"article_id" integer PRIMARY KEY NOT NULL,
	"source_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "article_category_overrides" ADD CONSTRAINT "article_category_overrides_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "article_category_overrides" ADD CONSTRAINT "article_category_overrides_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "article_category_overrides" ADD CONSTRAINT "article_category_overrides_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "article_category_overrides_source_idx" ON "article_category_overrides" USING btree ("source_id");
--> statement-breakpoint
CREATE INDEX "article_category_overrides_category_idx" ON "article_category_overrides" USING btree ("category_id");
--> statement-breakpoint
CREATE TABLE "source_category_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"url_pattern" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "source_category_rules" ADD CONSTRAINT "source_category_rules_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "source_category_rules" ADD CONSTRAINT "source_category_rules_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "source_category_rules_source_idx" ON "source_category_rules" USING btree ("source_id");
--> statement-breakpoint
CREATE INDEX "source_category_rules_category_idx" ON "source_category_rules" USING btree ("category_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "source_category_rules_source_pattern_idx" ON "source_category_rules" USING btree ("source_id","url_pattern");

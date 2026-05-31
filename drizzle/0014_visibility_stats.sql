CREATE TABLE "source_surface_rolling_stats" (
	"source_id" integer NOT NULL,
	"surface" text NOT NULL,
	"day" date NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"unique_clicks" integer DEFAULT 0 NOT NULL,
	"spend_amount" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_surface_rolling_stats_source_id_surface_day_pk" PRIMARY KEY("source_id","surface","day")
);
--> statement-breakpoint
ALTER TABLE "source_surface_rolling_stats" ADD CONSTRAINT "source_surface_rolling_stats_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "source_surface_rolling_stats" (
	"source_id",
	"surface",
	"day",
	"impressions",
	"updated_at"
)
SELECT
	"source_id",
	"surface",
	"created_at"::date,
	count(*)::int,
	now()
FROM "impression_events"
WHERE "is_bot" = false
	AND "surface" IS NOT NULL
	AND "created_at" >= now() - interval '90 days'
GROUP BY "source_id", "surface", "created_at"::date
ON CONFLICT ("source_id", "surface", "day") DO UPDATE SET
	"impressions" = "source_surface_rolling_stats"."impressions" + EXCLUDED."impressions",
	"updated_at" = now();
--> statement-breakpoint
INSERT INTO "source_surface_rolling_stats" (
	"source_id",
	"surface",
	"day",
	"clicks",
	"unique_clicks",
	"spend_amount",
	"updated_at"
)
SELECT
	"source_id",
	"surface",
	"created_at"::date,
	count(*)::int,
	count(*) FILTER (WHERE "is_unique" = true)::int,
	coalesce(sum("charge_amount"), 0)::int,
	now()
FROM "click_events"
WHERE "is_bot" = false
	AND "surface" IS NOT NULL
	AND "created_at" >= now() - interval '90 days'
GROUP BY "source_id", "surface", "created_at"::date
ON CONFLICT ("source_id", "surface", "day") DO UPDATE SET
	"clicks" = "source_surface_rolling_stats"."clicks" + EXCLUDED."clicks",
	"unique_clicks" = "source_surface_rolling_stats"."unique_clicks" + EXCLUDED."unique_clicks",
	"spend_amount" = "source_surface_rolling_stats"."spend_amount" + EXCLUDED."spend_amount",
	"updated_at" = now();
--> statement-breakpoint
DELETE FROM "click_events" WHERE "is_bot" = true;
--> statement-breakpoint
DROP INDEX IF EXISTS "click_events_bot_idx";
--> statement-breakpoint
ALTER TABLE "click_events" DROP COLUMN IF EXISTS "is_bot";
--> statement-breakpoint
ALTER TABLE "click_events" DROP COLUMN IF EXISTS "bot_name";
--> statement-breakpoint
DROP TABLE IF EXISTS "impression_events";
--> statement-breakpoint
DELETE FROM "source_surface_rolling_stats" WHERE "day" < current_date - 90;
--> statement-breakpoint
DELETE FROM "click_events" WHERE "created_at" < now() - interval '90 days';
--> statement-breakpoint
DELETE FROM "articles" WHERE "published_at" < now() - interval '90 days';
--> statement-breakpoint
CREATE INDEX "source_surface_rolling_stats_surface_day_idx" ON "source_surface_rolling_stats" USING btree ("surface","day");
--> statement-breakpoint
CREATE INDEX "source_surface_rolling_stats_day_idx" ON "source_surface_rolling_stats" USING btree ("day");

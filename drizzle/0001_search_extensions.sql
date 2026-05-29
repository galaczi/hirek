CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "articles_title_trgm_idx" ON "articles" USING gin ("title" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "articles_excerpt_trgm_idx" ON "articles" USING gin ("excerpt" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sources_name_trgm_idx" ON "sources" USING gin ("name" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "articles_search_vector_idx" ON "articles" USING gin (
	to_tsvector('simple', "title" || ' ' || coalesce("excerpt", ''))
);

ALTER TABLE "sources" ADD COLUMN "exchange_status" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
CREATE INDEX "sources_exchange_status_idx" ON "sources" USING btree ("exchange_status");
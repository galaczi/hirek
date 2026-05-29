ALTER TABLE "sources" ADD COLUMN "approval_status" text DEFAULT 'approved' NOT NULL;
--> statement-breakpoint
UPDATE "sources"
SET "approval_status" = 'approved'
WHERE "approval_status" IS DISTINCT FROM 'approved';
--> statement-breakpoint
CREATE INDEX "sources_approval_status_idx" ON "sources" USING btree ("approval_status");

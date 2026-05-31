CREATE TABLE "source_billing_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider" text DEFAULT 'local' NOT NULL,
	"external_id" text,
	"external_number" text,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_billing_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer NOT NULL,
	"invoice_id" integer,
	"entry_type" text NOT NULL,
	"funding_type" text,
	"surface" text,
	"article_id" integer,
	"amount" integer NOT NULL,
	"description" text NOT NULL,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "click_events" ADD COLUMN "surface" text;--> statement-breakpoint
ALTER TABLE "click_events" ADD COLUMN "acquisition_mode" text DEFAULT 'organic' NOT NULL;--> statement-breakpoint
ALTER TABLE "click_events" ADD COLUMN "charge_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "impression_events" ADD COLUMN "surface" text;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "trust_score" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "boost_status" text DEFAULT 'paused' NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "boost_route_targets" text DEFAULT 'home,top,category,source,source_category' NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "wallet_balance" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "exchange_credit_balance" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "max_cpc" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "daily_spend_cap" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "lifetime_billable_clicks" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "lifetime_wallet_spend" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "lifetime_exchange_spend" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "source_billing_invoices" ADD CONSTRAINT "source_billing_invoices_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_billing_ledger" ADD CONSTRAINT "source_billing_ledger_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_billing_ledger" ADD CONSTRAINT "source_billing_ledger_invoice_id_source_billing_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."source_billing_invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_billing_ledger" ADD CONSTRAINT "source_billing_ledger_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "source_billing_invoices_source_idx" ON "source_billing_invoices" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "source_billing_invoices_status_idx" ON "source_billing_invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "source_billing_ledger_source_idx" ON "source_billing_ledger" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "source_billing_ledger_invoice_idx" ON "source_billing_ledger" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "source_billing_ledger_entry_type_idx" ON "source_billing_ledger" USING btree ("entry_type");--> statement-breakpoint
CREATE INDEX "source_billing_ledger_created_at_idx" ON "source_billing_ledger" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "click_events_surface_idx" ON "click_events" USING btree ("surface");--> statement-breakpoint
CREATE INDEX "click_events_acquisition_mode_idx" ON "click_events" USING btree ("acquisition_mode");--> statement-breakpoint
CREATE INDEX "impression_events_surface_idx" ON "impression_events" USING btree ("surface");--> statement-breakpoint
CREATE INDEX "sources_boost_status_idx" ON "sources" USING btree ("boost_status");
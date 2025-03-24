DROP INDEX IF EXISTS "athlete_mentions_unique_idx";--> statement-breakpoint
ALTER TABLE "athlete_mentions" ALTER COLUMN "content_id" SET DATA TYPE uuid;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "athlete_mentions_unique_idx" ON "athlete_mentions" USING btree ("athlete_id","content_id","content_type","source");
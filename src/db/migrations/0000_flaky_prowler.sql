CREATE TABLE IF NOT EXISTS "episodes" (
	"id" text PRIMARY KEY NOT NULL,
	"podcast_id" uuid,
	"title" text NOT NULL,
	"pub_date" timestamp NOT NULL,
	"description" text,
	"link" text,
	"enclosure_url" text,
	"duration" text,
	"explicit" text,
	"image" text,
	"episode_number" integer,
	"season" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "podcasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"feed_url" text NOT NULL,
	"image" text,
	"creator" text,
	"author" text,
	"link" text,
	"language" text,
	"last_build_date" timestamp,
	"itunes_owner_name" text,
	"itunes_owner_email" text,
	"itunes_image" text,
	"itunes_author" text,
	"itunes_summary" text,
	"itunes_explicit" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "episodes" ADD CONSTRAINT "episodes_podcast_id_podcasts_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podcasts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

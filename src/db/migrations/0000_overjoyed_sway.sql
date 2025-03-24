CREATE TABLE IF NOT EXISTS "athlete_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "athlete_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "athlete_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"name" text NOT NULL,
	"date" date NOT NULL,
	"location" text,
	"discipline" text,
	"description" text,
	"website" text,
	"status" text NOT NULL,
	"result" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "athlete_gear" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"name" text NOT NULL,
	"brand" text NOT NULL,
	"category" text NOT NULL,
	"model" text,
	"description" text,
	"purchase_url" text,
	"image_url" text,
	"is_current" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "athlete_honors" (
	"id" text PRIMARY KEY NOT NULL,
	"athlete_id" text NOT NULL,
	"category_name" text NOT NULL,
	"competition" text NOT NULL,
	"discipline" text NOT NULL,
	"mark" text,
	"place" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "athlete_mentions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" text NOT NULL,
	"content_id" text NOT NULL,
	"content_type" text NOT NULL,
	"source" text NOT NULL,
	"confidence" numeric NOT NULL,
	"context" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "athlete_results" (
	"id" text PRIMARY KEY NOT NULL,
	"athlete_id" text NOT NULL,
	"competition_name" text,
	"date" date NOT NULL,
	"discipline" text NOT NULL,
	"performance" text NOT NULL,
	"place" text,
	"wind" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "athlete_sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"name" text NOT NULL,
	"website" text,
	"logo" text,
	"start_date" date,
	"end_date" date,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "athletes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"world_athletics_id" text,
	"category_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"country_code" text,
	"country_name" text,
	"date_of_birth" date,
	"bio" text,
	"social_media" jsonb,
	"image_url" text,
	"verified" boolean DEFAULT false,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "athletes_world_athletics_id_unique" UNIQUE("world_athletics_id"),
	CONSTRAINT "athletes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"youtube_channel_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"custom_url" text,
	"published_at" timestamp,
	"thumbnail_url" text,
	"vibrant_color" text,
	"country" text,
	"view_count" text,
	"subscriber_count" text,
	"video_count" text,
	"uploads_playlist_id" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "content_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"content_type" text NOT NULL,
	"tag" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "episodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"podcast_id" uuid NOT NULL,
	"episode_slug" text NOT NULL,
	"title" text NOT NULL,
	"pub_date" timestamp,
	"content" text,
	"link" text,
	"enclosure_url" text NOT NULL,
	"duration" text NOT NULL,
	"explicit" text DEFAULT 'no',
	"image" text,
	"episode_image" text,
	"athlete_mentions_processed" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "episodes_enclosure_url_unique" UNIQUE("enclosure_url")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "podcasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"podcast_slug" text NOT NULL,
	"description" text,
	"feed_url" text NOT NULL,
	"image" text,
	"podcast_image" text,
	"vibrant_color" text,
	"author" text,
	"link" text,
	"language" text DEFAULT 'en',
	"last_build_date" timestamp,
	"itunes_owner_name" text,
	"itunes_owner_email" text,
	"itunes_image" text,
	"itunes_author" text,
	"itunes_summary" text,
	"itunes_explicit" text DEFAULT 'no',
	"episode_count" integer,
	"is_dead" integer DEFAULT 0,
	"has_parse_errors" integer DEFAULT 0,
	"itunes_id" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "podcasts_feed_url_unique" UNIQUE("feed_url")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"email" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "running_clubs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_name" text NOT NULL,
	"description" text,
	"city" text NOT NULL,
	"location" jsonb NOT NULL,
	"website" text,
	"social_media" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_updated" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_podcast_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"podcast_id" uuid NOT NULL,
	"is_favorite" boolean DEFAULT false,
	"last_viewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"youtube_video_id" text NOT NULL,
	"channel_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"channel_title" text,
	"thumbnail_url" text,
	"published_at" timestamp,
	"view_count" text,
	"like_count" text,
	"comment_count" text,
	"tags" text[],
	"duration" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "websub_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic" text NOT NULL,
	"hub" text NOT NULL,
	"secret" text NOT NULL,
	"lease_seconds" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "websub_subscriptions_topic_unique" UNIQUE("topic")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "world_records" (
	"id" text PRIMARY KEY NOT NULL,
	"discipline" text NOT NULL,
	"gender" text NOT NULL,
	"performance" text NOT NULL,
	"date" date NOT NULL,
	"competitor_id" text,
	"competitor_name" text,
	"team_members" jsonb,
	"mixed" boolean DEFAULT false,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "athlete_events" ADD CONSTRAINT "athlete_events_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "athlete_gear" ADD CONSTRAINT "athlete_gear_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "athlete_honors" ADD CONSTRAINT "athlete_honors_athlete_id_athletes_world_athletics_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("world_athletics_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "athlete_mentions" ADD CONSTRAINT "athlete_mentions_athlete_id_athletes_world_athletics_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("world_athletics_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "athlete_results" ADD CONSTRAINT "athlete_results_athlete_id_athletes_world_athletics_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("world_athletics_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "athlete_sponsors" ADD CONSTRAINT "athlete_sponsors_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "athletes" ADD CONSTRAINT "athletes_category_id_athlete_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."athlete_categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "episodes" ADD CONSTRAINT "episodes_podcast_id_podcasts_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podcasts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_podcast_preferences" ADD CONSTRAINT "user_podcast_preferences_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_podcast_preferences" ADD CONSTRAINT "user_podcast_preferences_podcast_id_podcasts_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podcasts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "videos" ADD CONSTRAINT "videos_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_athlete_mentions_athlete_content" ON "athlete_mentions" USING btree ("athlete_id","content_id","confidence");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_athlete_mentions_content_athlete" ON "athlete_mentions" USING btree ("content_id","athlete_id","confidence");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "athlete_mentions_unique_idx" ON "athlete_mentions" USING btree ("athlete_id","content_id","source");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "youtube_channel_id_idx" ON "channels" USING btree ("youtube_channel_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "content_tag_idx" ON "content_tags" USING btree ("content_id","content_type","tag");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "enclosure_url_idx" ON "episodes" USING btree ("enclosure_url");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "feed_url_idx" ON "podcasts" USING btree ("feed_url");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "youtube_video_id_idx" ON "videos" USING btree ("youtube_video_id");
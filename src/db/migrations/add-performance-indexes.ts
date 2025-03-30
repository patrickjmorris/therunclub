import { sql } from "drizzle-orm";
import { pgTable, index } from "drizzle-orm/pg-core";
import {
	podcasts,
	episodes,
	videos,
	contentTags,
	athleteMentions,
} from "../schema";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";

// This migration adds important performance indexes to improve query speed

export const performanceIndexes = {
	// Add index for episodes table on podcastId and pubDate for faster episode listing
	episodesPodcastPubDateIdx: index("idx_episodes_podcast_pubdate").on(
		episodes.podcastId,
		episodes.pubDate,
	),

	// Add index for videos table on publishedAt for faster video listing and sorting
	videosPublishedAtIdx: index("idx_videos_published_at").on(videos.publishedAt),

	// Add index for contentTags table on tag field for faster tag searches
	contentTagsTagIdx: index("idx_content_tags_tag").on(contentTags.tag),

	// Add combined index for contentTags on contentType and tag for faster filtered tag searches
	contentTagsTypeTagIdx: index("idx_content_tags_type_tag").on(
		contentTags.contentType,
		contentTags.tag,
	),

	// Add index for athleteMentions on contentType for faster content type filtering
	athleteMentionsContentTypeIdx: index("idx_athlete_mentions_content_type").on(
		athleteMentions.contentType,
	),

	// Add index for episodes table on enclosureUrl
	episodesEnclosureUrlIdx: index("idx_episodes_enclosure_url").on(
		episodes.enclosureUrl,
	),

	// Add index for podcasts table on title for faster podcast title searches
	podcastsTitleIdx: index("idx_podcasts_title").on(podcasts.title),

	// Add index for episodes table on title for faster episode title searches
	episodesTitleIdx: index("idx_episodes_title").on(episodes.title),

	// Add index for videos table on title for faster video title searches
	videosTitleIdx: index("idx_videos_title").on(videos.title),
};

// Export up and down functions for the migration
export async function up(db: PostgresJsDatabase) {
	console.log("Adding performance indexes...");

	// Create indexes for episodes table
	await db.execute(
		sql`CREATE INDEX IF NOT EXISTS "idx_episodes_podcast_pubdate" ON "episodes" ("podcast_id", "pub_date")`,
	);

	// Create index for videos table
	await db.execute(
		sql`CREATE INDEX IF NOT EXISTS "idx_videos_published_at" ON "videos" ("published_at")`,
	);

	// Create index for contentTags table
	await db.execute(
		sql`CREATE INDEX IF NOT EXISTS "idx_content_tags_tag" ON "content_tags" ("tag")`,
	);

	await db.execute(
		sql`CREATE INDEX IF NOT EXISTS "idx_content_tags_type_tag" ON "content_tags" ("content_type", "tag")`,
	);

	// Create index for athleteMentions table
	await db.execute(
		sql`CREATE INDEX IF NOT EXISTS "idx_athlete_mentions_content_type" ON "athlete_mentions" ("content_type")`,
	);

	// Create index for episodes enclosureUrl
	await db.execute(
		sql`CREATE INDEX IF NOT EXISTS "idx_episodes_enclosure_url" ON "episodes" ("enclosure_url")`,
	);

	// Create title indexes
	await db.execute(
		sql`CREATE INDEX IF NOT EXISTS "idx_podcasts_title" ON "podcasts" ("title")`,
	);

	await db.execute(
		sql`CREATE INDEX IF NOT EXISTS "idx_episodes_title" ON "episodes" ("title")`,
	);

	await db.execute(
		sql`CREATE INDEX IF NOT EXISTS "idx_videos_title" ON "videos" ("title")`,
	);

	console.log("Performance indexes added successfully");
}

export async function down(db: PostgresJsDatabase) {
	console.log("Removing performance indexes...");

	// Drop indexes
	await db.execute(sql`DROP INDEX IF EXISTS "idx_episodes_podcast_pubdate"`);
	await db.execute(sql`DROP INDEX IF EXISTS "idx_videos_published_at"`);
	await db.execute(sql`DROP INDEX IF EXISTS "idx_content_tags_tag"`);
	await db.execute(sql`DROP INDEX IF EXISTS "idx_content_tags_type_tag"`);
	await db.execute(
		sql`DROP INDEX IF EXISTS "idx_athlete_mentions_content_type"`,
	);
	await db.execute(sql`DROP INDEX IF EXISTS "idx_episodes_enclosure_url"`);
	await db.execute(sql`DROP INDEX IF EXISTS "idx_podcasts_title"`);
	await db.execute(sql`DROP INDEX IF EXISTS "idx_episodes_title"`);
	await db.execute(sql`DROP INDEX IF EXISTS "idx_videos_title"`);

	console.log("Performance indexes removed successfully");
}

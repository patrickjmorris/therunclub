import {
	pgTable,
	text,
	timestamp,
	integer,
	uuid,
	uniqueIndex,
	boolean,
	pgSchema,
	foreignKey,
	pgPolicy,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { authenticatedRole, authUsers } from "drizzle-orm/supabase";

// This table extends Supabase auth.users

export const profiles = pgTable(
	"profiles",
	{
		id: uuid().primaryKey().notNull(),
		fullName: text("full_name"),
		avatarUrl: text("avatar_url"),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
		email: text().notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.id],
			// reference to the auth table from Supabase
			foreignColumns: [authUsers.id],
			name: "profiles_id_fk",
		}).onDelete("cascade"),
		pgPolicy("authenticated can view all profiles", {
			for: "select",
			// using predefined role from Supabase
			to: authenticatedRole,
			using: sql`true`,
		}),
	],
);

// YouTube Schemas
export const channels = pgTable(
	"channels",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		youtubeChannelId: text("youtube_channel_id").notNull(),
		title: text("title").notNull(),
		description: text("description"),
		customUrl: text("custom_url"),
		publishedAt: timestamp("published_at"),
		thumbnailUrl: text("thumbnail_url"),
		country: text("country"),
		viewCount: text("view_count"),
		subscriberCount: text("subscriber_count"),
		videoCount: text("video_count"),
		uploadsPlaylistId: text("uploads_playlist_id"),
		createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
		updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
	},
	(table) => ({
		youtubeChannelIdIdx: uniqueIndex("youtube_channel_id_idx").on(
			table.youtubeChannelId,
		),
	}),
);

export const videos = pgTable(
	"videos",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		youtubeVideoId: text("youtube_video_id").notNull(),
		channelId: uuid("channel_id")
			.notNull()
			.references(() => channels.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		description: text("description"),
		channelTitle: text("channel_title"),
		thumbnailUrl: text("thumbnail_url"),
		publishedAt: timestamp("published_at"),
		viewCount: text("view_count"),
		likeCount: text("like_count"),
		commentCount: text("comment_count"),
		tags: text("tags").array(),
		duration: text("duration"),
		createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
		updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
	},
	(table) => ({
		youtubeVideoIdIdx: uniqueIndex("youtube_video_id_idx").on(
			table.youtubeVideoId,
		),
	}),
);

export const podcasts = pgTable(
	"podcasts",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		title: text("title").notNull(),
		podcastSlug: text("podcast_slug").default(""),
		description: text("description").default(""),
		feedUrl: text("feed_url").notNull(),
		image: text("image").default(""),
		creator: text("creator").default(""),
		author: text("author").default(""),
		link: text("link").default(""),
		language: text("language").default("en"),
		lastBuildDate: timestamp("last_build_date").default(sql`CURRENT_TIMESTAMP`),
		itunesOwnerName: text("itunes_owner_name").default(""),
		itunesOwnerEmail: text("itunes_owner_email").default(""),
		itunesImage: text("itunes_image").default(""),
		itunesAuthor: text("itunes_author").default(""),
		itunesSummary: text("itunes_summary").default(""),
		itunesExplicit: text("itunes_explicit", { enum: ["yes", "no"] }).default(
			"no",
		),
	},
	(table) => ({
		feedUrlIdx: uniqueIndex("feed_url_idx").on(table.feedUrl),
	}),
);

export const episodes = pgTable("episodes", {
	id: text("id").notNull().primaryKey(),
	podcastId: uuid("podcast_id")
		.notNull()
		.references(() => podcasts.id),
	episodeSlug: text("episode_slug").notNull(),
	title: text("title").notNull(),
	pubDate: timestamp("pub_date").default(sql`CURRENT_TIMESTAMP`).notNull(),
	content: text("content").default(""),
	link: text("link").default(""),
	enclosureUrl: text("enclosure_url").notNull(),
	duration: text("duration").default(""),
	explicit: text("explicit", { enum: ["yes", "no"] }).default("no"),
	image: text("image").default(""),
	episodeNumber: integer("episode_number"),
	season: text("season").default(""),
});

export const userPodcastPreferences = pgTable("user_podcast_preferences", {
	id: uuid("id").primaryKey().defaultRandom(),
	profileId: uuid("profile_id")
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),
	podcastId: uuid("podcast_id")
		.notNull()
		.references(() => podcasts.id, { onDelete: "cascade" }),
	isFavorite: boolean("is_favorite").default(false),
	lastViewedAt: timestamp("last_viewed_at"),
});

// Define all relations
export const podcastsRelations = relations(podcasts, ({ many }) => ({
	episodes: many(episodes),
	preferences: many(userPodcastPreferences),
}));

export const episodesRelations = relations(episodes, ({ one }) => ({
	podcast: one(podcasts, {
		fields: [episodes.podcastId],
		references: [podcasts.id],
	}),
}));

export const userPodcastPreferencesRelations = relations(
	userPodcastPreferences,
	({ one }) => ({
		profile: one(profiles, {
			fields: [userPodcastPreferences.profileId],
			references: [profiles.id],
		}),
		podcast: one(podcasts, {
			fields: [userPodcastPreferences.podcastId],
			references: [podcasts.id],
		}),
	}),
);

// Define relations
export const channelsRelations = relations(channels, ({ many }) => ({
	videos: many(videos),
}));

export const videosRelations = relations(videos, ({ one }) => ({
	channel: one(channels, {
		fields: [videos.channelId],
		references: [channels.id],
	}),
}));

// Types
export type User = typeof authUsers.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Podcast = typeof podcasts.$inferSelect;
export type Episode = typeof episodes.$inferSelect;
export type UserPodcastPreference = typeof userPodcastPreferences.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type NewVideo = typeof videos.$inferInsert;
export type Channel = typeof channels.$inferSelect;
export type NewChannel = typeof channels.$inferInsert;

// Zod Schemas
export const insertProfileSchema = createInsertSchema(profiles);
export const selectProfileSchema = createSelectSchema(profiles);

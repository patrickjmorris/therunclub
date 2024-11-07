import {
	pgTable,
	text,
	timestamp,
	integer,
	uuid,
	uniqueIndex,
	boolean,
	pgSchema,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";

// Define auth schema
export const authSchema = pgSchema("auth");

// Define auth.users table
export const users = authSchema.table("users", {
	id: uuid("id").primaryKey(),
	email: text("email"),
});

// This table extends Supabase auth.users
export const profiles = pgTable(
	"profiles",
	{
		id: uuid("id")
			.primaryKey()
			.references(() => authUsers.id, { onDelete: "cascade" }),
		email: text("email").notNull(),
		fullName: text("full_name"),
		avatarUrl: text("avatar_url"),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => {
		return {
			emailIdx: uniqueIndex("profiles_email_idx").on(table.email),
		};
	},
);

// Videos schema
export const videos = pgTable(
	"videos",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		youtubeVideoId: text("youtube_video_id").notNull(),
		title: text("title").notNull(),
		channelTitle: text("channel_title"),
		category: text("category"),
		publishedAt: timestamp("published_at"),
		createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
	},
	(table) => ({
		youtubeIdIdx: uniqueIndex("youtube_video_id_idx").on(table.youtubeVideoId),
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

// Types
export type User = typeof authUsers.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Podcast = typeof podcasts.$inferSelect;
export type Episode = typeof episodes.$inferSelect;
export type UserPodcastPreference = typeof userPodcastPreferences.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type NewVideo = typeof videos.$inferInsert;

// Zod Schemas
export const insertProfileSchema = createInsertSchema(profiles);
export const selectProfileSchema = createSelectSchema(profiles);

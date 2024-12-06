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
	jsonb,
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
		// pgPolicy("authenticated can view all profiles", {
		// 	for: "select",
		// 	// using predefined role from Supabase
		// 	to: authenticatedRole,
		// 	using: sql`true`,
		// }),
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
		podcastSlug: text("podcast_slug").notNull(),
		description: text("description"),
		feedUrl: text("feed_url").notNull().unique(),
		image: text("image"),
		vibrantColor: text("vibrant_color"),
		author: text("author"),
		link: text("link"),
		language: text("language").default("en"),
		lastBuildDate: timestamp("last_build_date"),
		itunesOwnerName: text("itunes_owner_name"),
		itunesOwnerEmail: text("itunes_owner_email"),
		itunesImage: text("itunes_image"),
		itunesAuthor: text("itunes_author"),
		itunesSummary: text("itunes_summary"),
		itunesExplicit: text("itunes_explicit", { enum: ["yes", "no"] }).default(
			"no",
		),
		episodeCount: integer("episode_count"),
		isDead: integer("is_dead").default(0),
		hasParseErrors: integer("has_parse_errors").default(0),
		iTunesId: text("itunes_id").notNull().unique(),
	},
	(table) => ({
		feedUrlIdx: uniqueIndex("feed_url_idx").on(table.feedUrl),
	}),
);

export const episodes = pgTable("episodes", {
	id: uuid("id").primaryKey().defaultRandom(),
	podcastId: uuid("podcast_id")
		.notNull()
		.references(() => podcasts.id),
	episodeSlug: text("episode_slug").notNull(),
	title: text("title").notNull(),
	pubDate: timestamp("pub_date"),
	content: text("content"),
	link: text("link"),
	enclosureUrl: text("enclosure_url").notNull().unique(),
	duration: text("duration").notNull(),
	explicit: text("explicit", { enum: ["yes", "no"] }).default("no"),
	image: text("image"),
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

export const runningClubs = pgTable("running_clubs", {
	id: uuid("id").defaultRandom().primaryKey(),
	clubName: text("club_name").notNull(),
	description: text("description"),
	city: text("city").notNull(),

	// Location as JSON object with nullish coordinates
	location: jsonb("location").notNull().$type<{
		city: string;
		state: string | null;
		country: string;
		coordinates?: {
			latitude?: number | null;
			longitude?: number | null;
		} | null;
	}>(),

	// URLs
	website: text("website"),

	// Social Media as JSON object with nullish fields
	socialMedia: jsonb("social_media").$type<{
		facebook?: string | null;
		instagram?: string | null;
		twitter?: string | null;
		strava?: string | null;
	}>(),

	// Metadata as JSON object with nullish fields
	metadata: jsonb("metadata").$type<{
		foundedYear?: number | null;
		memberCount?: number | null;
		meetupSchedule?: string | null;
		difficultyLevel?:
			| "Beginner"
			| "Intermediate"
			| "Advanced"
			| "All Levels"
			| null;
		tags?: string[] | null;
		amenities?: string[] | null;
		events?: Array<{
			name: string;
			date?: string | null;
			description?: string | null;
		}> | null;
	}>(),

	// Timestamps
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
	lastUpdated: timestamp("last_updated").notNull(),
});

// Zod schemas for type validation
export const insertClubSchema = createInsertSchema(runningClubs);
export const selectClubSchema = createSelectSchema(runningClubs);

// Types
export type RunningClub = typeof runningClubs.$inferSelect;
export type NewRunningClub = typeof runningClubs.$inferInsert;

export const races = pgTable("races", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	date: timestamp("date").notNull(),
	registrationDeadline: timestamp("registration_deadline"),
	location: text("location").notNull(),
	distance: integer("distance").notNull(), // in meters
	elevation: integer("elevation"), // in meters
	price: integer("price"), // in cents
	type: text("type", {
		enum: ["road", "trail", "track", "cross_country"],
	}).notNull(),
	terrain: text("terrain", {
		enum: ["road", "trail", "track", "mixed"],
	}).notNull(),
	website: text("website"),
	organizerId: uuid("organizer_id").references(() => profiles.id),
	maxParticipants: integer("max_participants"),
	currentParticipants: integer("current_participants"),

	// New fields from RunSignUp API
	externalId: text("external_id").unique(), // RunSignUp race_id
	registrationStatus: text("registration_status", {
		enum: ["not_open", "open", "closed", "waitlist"],
	}).default("not_open"),
	isTimed: boolean("is_timed").default(true),
	timingMethod: text("timing_method", {
		enum: ["chip", "gun", "both"],
	}),
	isVirtual: boolean("is_virtual").default(false),
	ageRestrictions: jsonb("age_restrictions").$type<{
		minAge?: number;
		maxAge?: number;
	}>(),
	images: jsonb("images").$type<{
		logo?: string;
		header?: string;
	}>(),

	// Metadata
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Add race relations
export const racesRelations = relations(races, ({ one }) => ({
	organizer: one(profiles, {
		fields: [races.organizerId],
		references: [profiles.id],
	}),
}));

// Add types for races
export type Race = typeof races.$inferSelect;
export type NewRace = typeof races.$inferInsert;

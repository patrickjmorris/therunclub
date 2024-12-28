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
	date,
	numeric,
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
		vibrantColor: text("vibrant_color"),
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
		iTunesId: text("itunes_id").unique(),
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

export const userRoles = pgTable("user_roles", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),
	role: text("role", { enum: ["admin", "editor", "user"] })
		.notNull()
		.default("user"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Zod schemas for user roles
export const insertUserRoleSchema = createInsertSchema(userRoles);
export const selectUserRoleSchema = createSelectSchema(userRoles);

// Types
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
export type UserRoleType = "admin" | "editor" | "user";

export const athletes = pgTable("athletes", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	countryCode: text("country_code"),
	countryName: text("country_name"),
	dateOfBirth: date("date_of_birth"),
	bio: text("bio"),
	socialMedia: jsonb("social_media").$type<{
		twitter?: string;
		instagram?: string;
		facebook?: string;
		website?: string;
	}>(),
	verified: boolean("verified").default(false),
	updatedAt: timestamp("updated_at").defaultNow(),
	createdAt: timestamp("created_at").defaultNow(),
});

export const athleteHonors = pgTable("athlete_honors", {
	id: text("id").primaryKey(),
	athleteId: text("athlete_id")
		.notNull()
		.references(() => athletes.id),
	categoryName: text("category_name").notNull(),
	competition: text("competition").notNull(),
	discipline: text("discipline").notNull(),
	mark: text("mark"),
	place: text("place"),
	createdAt: timestamp("created_at").defaultNow(),
});

export const athleteResults = pgTable("athlete_results", {
	id: text("id").primaryKey(),
	athleteId: text("athlete_id").references(() => athletes.id),
	competitionName: text("competition_name"),
	date: date("date").notNull(),
	discipline: text("discipline").notNull(),
	performance: text("performance").notNull(),
	place: text("place"),
	wind: text("wind"),
});

// Update relations
export const athleteRelations = relations(athletes, ({ many }) => ({
	results: many(athleteResults),
	honors: many(athleteHonors),
}));

export const athleteResultsRelations = relations(athleteResults, ({ one }) => ({
	athlete: one(athletes, {
		fields: [athleteResults.athleteId],
		references: [athletes.id],
	}),
}));

export const athleteHonorsRelations = relations(athleteHonors, ({ one }) => ({
	athlete: one(athletes, {
		fields: [athleteHonors.athleteId],
		references: [athletes.id],
	}),
}));

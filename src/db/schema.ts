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
	index,
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
		podcastImage: text("podcast_image"),
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
		iTunesId: text("itunes_id"),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(table) => ({
		feedUrlIdx: uniqueIndex("feed_url_idx").on(table.feedUrl),
	}),
);

export const episodes = pgTable(
	"episodes",
	{
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
		episodeImage: text("episode_image"),
		athleteMentionsProcessed: boolean("athlete_mentions_processed").default(
			false,
		),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(table) => ({
		enclosureUrlIdx: uniqueIndex("enclosure_url_idx").on(table.enclosureUrl),
	}),
);

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

export const episodesRelations = relations(episodes, ({ one, many }) => ({
	podcast: one(podcasts, {
		fields: [episodes.podcastId],
		references: [podcasts.id],
	}),
	athleteMentions: many(athleteMentions),
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

export const athleteCategories = pgTable("athlete_categories", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull().unique(),
	description: text("description"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Add types for athlete categories
export type AthleteCategory = typeof athleteCategories.$inferSelect;
export type NewAthleteCategory = typeof athleteCategories.$inferInsert;

// Add Zod schemas for athlete categories
export const insertAthleteCategorySchema =
	createInsertSchema(athleteCategories);
export const selectAthleteCategorySchema =
	createSelectSchema(athleteCategories);

export const athletes = pgTable("athletes", {
	id: uuid("id").primaryKey().defaultRandom(),
	worldAthleticsId: text("world_athletics_id").unique(),
	categoryId: uuid("category_id").references(() => athleteCategories.id),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	countryCode: text("country_code"),
	countryName: text("country_name"),
	dateOfBirth: date("date_of_birth"),
	bio: text("bio"),
	socialMedia: jsonb("social_media").$type<{
		twitter?: string;
		instagram?: string;
		facebook?: string;
		website?: string;
		strava?: string;
	}>(),
	imageUrl: text("image_url"),
	verified: boolean("verified").default(false),
	updatedAt: timestamp("updated_at"),
	createdAt: timestamp("created_at").defaultNow(),
});

export const athleteHonors = pgTable("athlete_honors", {
	id: text("id").primaryKey(),
	athleteId: text("athlete_id")
		.notNull()
		.references(() => athletes.worldAthleticsId),
	categoryName: text("category_name").notNull(),
	competition: text("competition").notNull(),
	discipline: text("discipline").notNull(),
	mark: text("mark"),
	place: text("place"),
	createdAt: timestamp("created_at").defaultNow(),
});

export const athleteResults = pgTable("athlete_results", {
	id: text("id").primaryKey(),
	athleteId: text("athlete_id")
		.notNull()
		.references(() => athletes.worldAthleticsId),
	competitionName: text("competition_name"),
	date: date("date").notNull(),
	discipline: text("discipline").notNull(),
	performance: text("performance").notNull(),
	place: text("place"),
	wind: text("wind"),
});

export const athleteSponsors = pgTable("athlete_sponsors", {
	id: uuid("id").defaultRandom().primaryKey(),
	athleteId: uuid("athlete_id")
		.notNull()
		.references(() => athletes.id),
	name: text("name").notNull(),
	website: text("website"),
	logo: text("logo"),
	startDate: date("start_date"),
	endDate: date("end_date"),
	isPrimary: boolean("is_primary").default(false),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export const athleteGear = pgTable("athlete_gear", {
	id: uuid("id").defaultRandom().primaryKey(),
	athleteId: uuid("athlete_id")
		.notNull()
		.references(() => athletes.id),
	name: text("name").notNull(),
	brand: text("brand").notNull(),
	category: text("category", {
		enum: [
			"racing_shoes",
			"training_shoes",
			"shirts",
			"shorts",
			"tights",
			"recovery",
			"other",
		],
	}).notNull(),
	model: text("model"),
	description: text("description"),
	purchaseUrl: text("purchase_url"),
	imageUrl: text("image_url"),
	isCurrent: boolean("is_current").default(true),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export const athleteEvents = pgTable("athlete_events", {
	id: uuid("id").primaryKey().defaultRandom(),
	athleteId: uuid("athlete_id")
		.notNull()
		.references(() => athletes.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	date: date("date").notNull(),
	location: text("location"),
	discipline: text("discipline"),
	description: text("description"),
	website: text("website"),
	status: text("status", {
		enum: ["upcoming", "completed", "cancelled"],
	}).notNull(),
	result: jsonb("result").$type<{
		place?: number;
		time?: string;
		notes?: string;
	}>(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const athleteMentions = pgTable(
	"athlete_mentions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		athleteId: text("athlete_id")
			.notNull()
			.references(() => athletes.worldAthleticsId, { onDelete: "cascade" }),
		episodeId: uuid("episode_id")
			.notNull()
			.references(() => episodes.id, { onDelete: "cascade" }),
		source: text("source", { enum: ["title", "description"] }).notNull(),
		confidence: numeric("confidence").notNull(),
		context: text("context").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	},
	(table) => ({
		athleteEpisodeIdx: index("idx_athlete_mentions_athlete_episode").on(
			table.athleteId,
			table.episodeId,
			table.confidence,
		),
		episodeAthleteIdx: index("idx_athlete_mentions_episode_athlete").on(
			table.episodeId,
			table.athleteId,
			table.confidence,
		),
		uniqueMentionIdx: uniqueIndex("athlete_mentions_unique_idx").on(
			table.athleteId,
			table.episodeId,
			table.source,
		),
	}),
);

// Update relations to use id instead of uuid
export const athleteRelations = relations(athletes, ({ one, many }) => ({
	category: one(athleteCategories, {
		fields: [athletes.categoryId],
		references: [athleteCategories.id],
	}),
	results: many(athleteResults),
	honors: many(athleteHonors),
	sponsors: many(athleteSponsors),
	gear: many(athleteGear),
	events: many(athleteEvents),
	mentions: many(athleteMentions),
}));

export const athleteResultsRelations = relations(athleteResults, ({ one }) => ({
	athlete: one(athletes, {
		fields: [athleteResults.athleteId],
		references: [athletes.worldAthleticsId],
	}),
}));

export const athleteHonorsRelations = relations(athleteHonors, ({ one }) => ({
	athlete: one(athletes, {
		fields: [athleteHonors.athleteId],
		references: [athletes.worldAthleticsId],
	}),
}));

export const athleteSponsorsRelations = relations(
	athleteSponsors,
	({ one }) => ({
		athlete: one(athletes, {
			fields: [athleteSponsors.athleteId],
			references: [athletes.id],
		}),
	}),
);

export const athleteGearRelations = relations(athleteGear, ({ one }) => ({
	athlete: one(athletes, {
		fields: [athleteGear.athleteId],
		references: [athletes.id],
	}),
}));

export const athleteEventsRelations = relations(athleteEvents, ({ one }) => ({
	athlete: one(athletes, {
		fields: [athleteEvents.athleteId],
		references: [athletes.id],
	}),
}));

export const athleteMentionsRelations = relations(
	athleteMentions,
	({ one }) => ({
		athlete: one(athletes, {
			fields: [athleteMentions.athleteId],
			references: [athletes.worldAthleticsId],
		}),
		episode: one(episodes, {
			fields: [athleteMentions.episodeId],
			references: [episodes.id],
		}),
	}),
);

export const websubSubscriptions = pgTable("websub_subscriptions", {
	id: uuid("id").primaryKey().defaultRandom(),
	topic: text("topic").notNull().unique(), // The feed URL
	hub: text("hub").notNull(), // The WebSub hub URL
	secret: text("secret").notNull(), // Secret for verifying notifications
	leaseSeconds: integer("lease_seconds").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	status: text("status", { enum: ["pending", "active", "expired"] }).notNull(),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Add to relations
export const websubSubscriptionsRelations = relations(
	websubSubscriptions,
	({ one }) => ({
		podcast: one(podcasts, {
			fields: [websubSubscriptions.topic],
			references: [podcasts.feedUrl],
		}),
	}),
);

// Add to types
export type WebSubSubscription = typeof websubSubscriptions.$inferSelect;

// Content Tags table for AI-generated tags
export const contentTags = pgTable(
	"content_tags",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		contentId: uuid("content_id").notNull(),
		contentType: text("content_type").notNull(), // 'video', 'podcast', 'episode'
		tag: text("tag").notNull(),
		createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
	},
	(table) => ({
		contentTagIdx: uniqueIndex("content_tag_idx").on(
			table.contentId,
			table.contentType,
			table.tag,
		),
	}),
);

// Define relations for content tags
export const contentTagsRelations = relations(contentTags, ({ one }) => ({
	video: one(videos, {
		fields: [contentTags.contentId],
		references: [videos.id],
		relationName: "video_tags",
	}),
	podcast: one(podcasts, {
		fields: [contentTags.contentId],
		references: [podcasts.id],
		relationName: "podcast_tags",
	}),
	episode: one(episodes, {
		fields: [contentTags.contentId],
		references: [episodes.id],
		relationName: "episode_tags",
	}),
}));

// Add to types
export type ContentTag = typeof contentTags.$inferSelect;
export type NewContentTag = typeof contentTags.$inferInsert;

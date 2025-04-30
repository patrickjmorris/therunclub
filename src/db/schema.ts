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
	serial,
	pgEnum,
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
		importType: text("import_type", {
			enum: ["full_channel", "selected_videos", "none"],
		})
			.default("full_channel")
			.notNull(),
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
		athleteMentionsProcessed: boolean("athlete_mentions_processed").default(
			false,
		),
		createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
		updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
	},
	(table) => ({
		youtubeVideoIdIdx: uniqueIndex("youtube_video_id_idx").on(
			table.youtubeVideoId,
		),
		channelUpdatedIdx: index("idx_videos_channel_updated").on(
			table.channelId,
			table.updatedAt,
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
		podcastSlugIdx: uniqueIndex("idx_podcasts_slug").on(table.podcastSlug),
		podcastTitleIdx: index("idx_podcasts_title").on(table.title),
	}),
);

export const episodes = pgTable(
	"episodes",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		podcastId: uuid("podcast_id")
			.notNull()
			.references(() => podcasts.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		episodeSlug: text("episode_slug").notNull(),
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
		guid: text("guid").unique(),
		itunesEpisode: text("itunes_episode"),
	},
	(table) => ({
		// Primary identifier: GUID if available
		guidIdx: uniqueIndex("episodes_guid_idx")
			.on(table.guid)
			.where(sql`${table.guid} IS NOT NULL`),

		// Secondary identifier: enclosureUrl (required and unique)
		enclosureUrlIdx: uniqueIndex("episodes_enclosure_url_idx").on(
			table.enclosureUrl,
		),

		// Performance indexes
		episodesPodcastPubDateIdx: index("idx_episodes_podcast_pubdate").on(
			table.podcastId,
			table.pubDate,
		),
		episodesTitleIdx: index("idx_episodes_title").on(table.title),
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

export const athleteMentions = pgTable(
	"athlete_mentions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		athleteId: text("athlete_id")
			.notNull()
			.references(() => athletes.worldAthleticsId, { onDelete: "cascade" }),
		contentId: uuid("content_id").notNull(),
		contentType: text("content_type", { enum: ["podcast", "video"] }).notNull(),
		source: text("source", { enum: ["title", "description"] }).notNull(),
		confidence: numeric("confidence").notNull(),
		context: text("context").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => ({
		athleteContentIdx: index("idx_athlete_mentions_athlete_content").on(
			table.athleteId,
			table.contentId,
			table.confidence,
		),
		contentAthleteIdx: index("idx_athlete_mentions_content_athlete").on(
			table.contentId,
			table.athleteId,
			table.confidence,
		),
		uniqueMentionIdx: uniqueIndex("athlete_mentions_unique_idx").on(
			table.athleteId,
			table.contentId,
			table.contentType,
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

export const athleteMentionsRelations = relations(
	athleteMentions,
	({ one }) => ({
		athlete: one(athletes, {
			fields: [athleteMentions.athleteId],
			references: [athletes.worldAthleticsId],
		}),
		episode: one(episodes, {
			fields: [athleteMentions.contentId],
			references: [episodes.id],
			relationName: "episodeMentions",
		}),
		video: one(videos, {
			fields: [athleteMentions.contentId],
			references: [videos.id],
			relationName: "videoMentions",
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

export const podcastRankings = pgTable(
	"podcast_rankings",
	{
		id: serial("id").primaryKey(),
		rank: integer("rank").notNull(), // Position 1-10 based on Taddy API order
		taddyUuid: text("taddy_uuid").notNull(), // Taddy's unique ID for the podcast
		itunesId: integer("itunes_id"), // iTunes ID for joining with our podcasts table
		podcastName: text("podcast_name").notNull(), // Name from Taddy API
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(), // Timestamp of when the ranking was fetched
	},
	(table) => {
		return {
			itunesIdIndex: index("podcast_rankings_itunes_id_idx").on(table.itunesId),
			createdAtTimestampIndex: index("podcast_rankings_created_at_idx").on(
				table.createdAt,
			),
		};
	},
);

// Gear Schemas
export const gearCategoryEnum = pgEnum("gear_category", [
	"shoes",
	"apparel",
	"race_spikes",
	"training_tools",
	"fuel",
]);

export const sexAgeEnum = pgEnum("sex_age", ["mens", "womens", "kids"]);

export const gear = pgTable(
	"gear",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		slug: text("slug").unique().notNull(), // e.g. "brooks-adrenaline-gts-23"
		name: text("name").notNull(),
		brand: text("brand").notNull(),
		description: text("description"),
		price: numeric("price", { precision: 8, scale: 2 }).notNull(),
		rating: numeric("rating", { precision: 2, scale: 1 }),
		reviewCount: integer("review_count"),
		image: text("image").notNull(),
		link: text("link").notNull(),
		category: gearCategoryEnum("category").notNull(),
		sexAge: sexAgeEnum("sex_age"),
		merchant: text("merchant").default("runningwarehouse"),
		optimizedImageUrl: text("optimized_image_url"),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(table) => ({
		slugIdx: uniqueIndex("gear_slug_idx").on(table.slug),
		categoryIdx: index("gear_category_idx").on(table.category),
		brandIdx: index("gear_brand_idx").on(table.brand),
	}),
);

export const athleteGear = pgTable(
	"athlete_gear",
	{
		athleteId: uuid("athlete_id")
			.notNull()
			.references(() => athletes.id, { onDelete: "cascade" }),
		gearId: uuid("gear_id")
			.notNull()
			.references(() => gear.id, { onDelete: "cascade" }),
		relationship: text("relationship"), // "uses", "sponsored", etc.
	},
	(table) => ({
		pk: uniqueIndex("athlete_gear_pk").on(table.athleteId, table.gearId),
	}),
);

// Add relations for Gear and AthleteGear
export const gearRelations = relations(gear, ({ many }) => ({
	athleteGearEntries: many(athleteGear),
}));

export const athleteGearRelations = relations(athleteGear, ({ one }) => ({
	athlete: one(athletes, {
		fields: [athleteGear.athleteId],
		references: [athletes.id],
	}),
	gear: one(gear, {
		fields: [athleteGear.gearId],
		references: [gear.id],
	}),
}));

// Add Zod schemas for Gear
export const insertGearSchema = createInsertSchema(gear);
export const selectGearSchema = createSelectSchema(gear);
export const insertAthleteGearSchema = createInsertSchema(athleteGear);
export const selectAthleteGearSchema = createSelectSchema(athleteGear);

// Add types for Gear
export type Gear = typeof gear.$inferSelect;
export type NewGear = typeof gear.$inferInsert;
export type AthleteGear = typeof athleteGear.$inferSelect;
export type NewAthleteGear = typeof athleteGear.$inferInsert;

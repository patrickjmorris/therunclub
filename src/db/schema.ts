import {
	pgTable,
	text,
	timestamp,
	integer,
	uuid,
	uniqueIndex,
} from "drizzle-orm/pg-core";

export const podcasts = pgTable(
	"podcasts",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		title: text("title").notNull(),
		podcastSlug: text("podcast_slug"),
		description: text("description"),
		feedUrl: text("feed_url").notNull(),
		image: text("image"),
		creator: text("creator"),
		author: text("author"),
		link: text("link"),
		language: text("language"),
		lastBuildDate: timestamp("last_build_date"),
		itunesOwnerName: text("itunes_owner_name"),
		itunesOwnerEmail: text("itunes_owner_email"),
		itunesImage: text("itunes_image"),
		itunesAuthor: text("itunes_author"),
		itunesSummary: text("itunes_summary"),
		itunesExplicit: text("itunes_explicit", { enum: ["yes", "no"] }),
	},
	(table) => ({
		feedUrlIdx: uniqueIndex("feed_url_idx").on(table.feedUrl),
	}),
);

export const episodes = pgTable("episodes", {
	id: text("id").notNull().primaryKey(),
	podcastId: uuid("podcast_id").references(() => podcasts.id),
	episodeSlug: text("episode_slug"),
	title: text("title").notNull(),
	pubDate: timestamp("pub_date").notNull(),
	content: text("content"),
	link: text("link"),
	enclosureUrl: text("enclosure_url"),
	duration: text("duration"),
	explicit: text("explicit", { enum: ["yes", "no"] }),
	image: text("image"),
	episodeNumber: integer("episode_number"),
	season: text("season"),
});

export type Podcast = typeof podcasts.$inferSelect;
export type Episode = typeof episodes.$inferSelect;

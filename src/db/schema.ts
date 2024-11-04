import {
	pgTable,
	text,
	timestamp,
	integer,
	uuid,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const podcasts = pgTable(
	"podcasts",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		title: text("title").notNull(),
		podcastSlug: text("podcast_slug").default(''),
		description: text("description").default(''),
		feedUrl: text("feed_url").notNull(),
		image: text("image").default(''),
		creator: text("creator").default(''),
		author: text("author").default(''),
		link: text("link").default(''),
		language: text("language").default('en'),
		lastBuildDate: timestamp("last_build_date")
			.default(sql`CURRENT_TIMESTAMP`),
		itunesOwnerName: text("itunes_owner_name").default(''),
		itunesOwnerEmail: text("itunes_owner_email").default(''),
		itunesImage: text("itunes_image").default(''),
		itunesAuthor: text("itunes_author").default(''),
		itunesSummary: text("itunes_summary").default(''),
		itunesExplicit: text("itunes_explicit", { enum: ["yes", "no"] }).default('no'),
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
	pubDate: timestamp("pub_date")
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	content: text("content").default(''),
	link: text("link").default(''),
	enclosureUrl: text("enclosure_url").notNull(),
	duration: text("duration").default(''),
	explicit: text("explicit", { enum: ["yes", "no"] }).default('no'),
	image: text("image").default(''),
	episodeNumber: integer("episode_number"),
	season: text("season").default(''),
});

export type Podcast = typeof podcasts.$inferSelect;
export type Episode = typeof episodes.$inferSelect;

import type { MetadataRoute } from "next";
import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { athletes, channels, episodes, podcasts, videos } from "@/db/schema";
import { absoluteUrl } from "@/config/site";
import {
	getAthleteCountries,
	isNotableAthlete,
} from "@/lib/services/athlete-service";
import { getClubCities } from "@/lib/services/club-service";
import { getLatestPodcastRanking } from "@/lib/services/podcast-service";
import {
	getTagHubs,
	isCanonicalHub,
	tagHubPath,
} from "@/lib/services/tag-service";

export const revalidate = 86400;

const URLS_PER_FILE = 40000;

const STATIC_PATHS = [
	"/",
	"/podcasts",
	"/videos",
	"/videos/channels",
	"/athletes",
	"/clubs",
	"/races",
	"/gear",
	"/tags",
	"/calculators",
];

type SitemapId =
	| "static"
	| "podcasts"
	| "channels"
	| "athletes"
	| "tags"
	| "club-cities"
	| "athlete-countries"
	| `episodes-${number}`
	| `videos-${number}`;

async function chunkIds(
	prefix: "episodes" | "videos",
	table: typeof episodes | typeof videos,
) {
	const [{ total }] = await db.select({ total: count() }).from(table);
	const chunks = Math.max(1, Math.ceil(total / URLS_PER_FILE));
	return Array.from({ length: chunks }, (_, i) => `${prefix}-${i}` as const);
}

export async function generateSitemaps(): Promise<{ id: SitemapId }[]> {
	const [episodeIds, videoIds] = await Promise.all([
		chunkIds("episodes", episodes),
		chunkIds("videos", videos),
	]);
	const ids: SitemapId[] = [
		"static",
		"podcasts",
		"channels",
		"athletes",
		"tags",
		"club-cities",
		"athlete-countries",
		...episodeIds,
		...videoIds,
	];
	return ids.map((id) => ({ id }));
}

function chunkIndex(id: string) {
	return Number(id.slice(id.lastIndexOf("-") + 1));
}

async function podcastEntries(): Promise<MetadataRoute.Sitemap> {
	const rows = await db
		.select({
			slug: podcasts.podcastSlug,
			lastModified: podcasts.lastBuildDate,
		})
		.from(podcasts)
		.orderBy(podcasts.podcastSlug);
	return rows.map((row) => ({
		url: absoluteUrl(`/podcasts/${row.slug}`),
		lastModified: row.lastModified ?? undefined,
	}));
}

async function channelEntries(): Promise<MetadataRoute.Sitemap> {
	const rows = await db
		.select({ id: channels.id, lastModified: channels.updatedAt })
		.from(channels)
		.orderBy(channels.id);
	return rows.map((row) => ({
		url: absoluteUrl(`/videos/channels/${row.id}`),
		lastModified: row.lastModified ?? undefined,
	}));
}

// Episode URLs resolve by (podcast slug, episode slug); duplicates within a
// podcast collapse to one URL, so DISTINCT ON keeps the newest.
async function episodeEntries(chunk: number): Promise<MetadataRoute.Sitemap> {
	const rows = await db
		.selectDistinctOn([podcasts.podcastSlug, episodes.episodeSlug], {
			podcastSlug: podcasts.podcastSlug,
			episodeSlug: episodes.episodeSlug,
			pubDate: episodes.pubDate,
		})
		.from(episodes)
		.innerJoin(podcasts, eq(episodes.podcastId, podcasts.id))
		.orderBy(podcasts.podcastSlug, episodes.episodeSlug, desc(episodes.pubDate))
		.limit(URLS_PER_FILE)
		.offset(chunk * URLS_PER_FILE);
	return rows.map((row) => ({
		url: absoluteUrl(`/podcasts/${row.podcastSlug}/${row.episodeSlug}`),
		lastModified: row.pubDate ?? undefined,
	}));
}

async function videoEntries(chunk: number): Promise<MetadataRoute.Sitemap> {
	const rows = await db
		.select({ id: videos.id, publishedAt: videos.publishedAt })
		.from(videos)
		.orderBy(videos.id)
		.limit(URLS_PER_FILE)
		.offset(chunk * URLS_PER_FILE);
	return rows.map((row) => ({
		url: absoluteUrl(`/videos/${row.id}`),
		lastModified: row.publishedAt ?? undefined,
	}));
}

async function athleteEntries(): Promise<MetadataRoute.Sitemap> {
	const rows = await db
		.select({
			slug: athletes.slug,
			lastModified: sql<Date>`coalesce(${athletes.updatedAt}, ${athletes.createdAt})`,
		})
		.from(athletes)
		.where(isNotableAthlete)
		.orderBy(athletes.slug);
	return rows.map((row) => ({
		url: absoluteUrl(`/athletes/${row.slug}`),
		lastModified: row.lastModified ? new Date(row.lastModified) : undefined,
	}));
}

async function tagEntries(): Promise<MetadataRoute.Sitemap> {
	const hubs = await getTagHubs();
	return hubs.filter(isCanonicalHub).map((hub) => ({
		url: absoluteUrl(tagHubPath(hub)),
		lastModified: new Date(hub.lastModified),
	}));
}

async function staticEntries(): Promise<MetadataRoute.Sitemap> {
	const ranking = await getLatestPodcastRanking();
	return [
		...STATIC_PATHS.map((path) => ({ url: absoluteUrl(path) })),
		...(ranking
			? [
					{
						url: absoluteUrl("/podcasts/top"),
						lastModified: new Date(ranking.fetchedAt),
					},
			  ]
			: []),
	];
}

async function clubCityEntries(): Promise<MetadataRoute.Sitemap> {
	const cities = await getClubCities();
	return cities.map((city) => ({
		url: absoluteUrl(`/clubs/city/${city.slug}`),
		lastModified: new Date(city.lastModified),
	}));
}

async function athleteCountryEntries(): Promise<MetadataRoute.Sitemap> {
	const countries = await getAthleteCountries();
	return countries.map((country) => ({
		url: absoluteUrl(`/athletes/country/${country.slug}`),
		lastModified: new Date(country.lastModified),
	}));
}

export default async function sitemap({
	id,
}: {
	id: SitemapId;
}): Promise<MetadataRoute.Sitemap> {
	if (id === "static") return staticEntries();
	if (id === "podcasts") return podcastEntries();
	if (id === "channels") return channelEntries();
	if (id === "athletes") return athleteEntries();
	if (id === "tags") return tagEntries();
	if (id === "club-cities") return clubCityEntries();
	if (id === "athlete-countries") return athleteCountryEntries();
	if (id.startsWith("episodes-")) return episodeEntries(chunkIndex(id));
	if (id.startsWith("videos-")) return videoEntries(chunkIndex(id));
	return [];
}

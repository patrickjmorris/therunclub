import { db } from "@/db/client";
import {
	athleteHonors,
	athleteMentions,
	athleteResults,
	athletes,
	episodes,
	podcasts,
} from "@/db/schema";
import {
	desc,
	eq,
	sql,
	and,
	inArray,
	like,
	isNotNull,
	ilike,
} from "drizzle-orm";

// Define the exact type structure we're returning from the query
export type AthleteMention = {
	id: string;
	athleteId: string;
	episodeId: string;
	source: "title" | "description";
	confidence: string;
	context: string;
	createdAt: Date | null;
	episode: {
		id: string;
		title: string;
		episodeSlug: string;
		content: string | null;
		pubDate: Date | null;
		image: string | null;
		duration: string;
		podcastSlug: string;
		podcastTitle: string;
		podcastImage: string | null;
		podcastId: string;
		podcastAuthor: string | null;
		enclosureUrl: string | null;
		explicit: "yes" | "no" | null;
		link: string | null;
	};
	podcast: {
		id: string;
		title: string;
		image: string | null;
		podcastSlug: string;
	};
};

export async function getAthleteRecentMentions(athleteId: string, limit = 15) {
	// Get the highest confidence mention IDs for each episode
	const mentionIds = await db.execute<{ id: string }>(sql`
		SELECT DISTINCT ON (episode_id) id
		FROM athlete_mentions
		WHERE athlete_id = ${athleteId}
		ORDER BY episode_id, confidence DESC
		LIMIT ${limit}
	`);

	// Fetch full details with an explicit join so we can sort by episodes.pubDate
	return await db
		.select({
			// Top-level mention fields
			id: athleteMentions.id,
			athleteId: athleteMentions.athleteId,
			episodeId: athleteMentions.episodeId,
			source: athleteMentions.source,
			confidence: athleteMentions.confidence,
			context: athleteMentions.context,
			createdAt: athleteMentions.createdAt,

			// Episode and Podcast fields
			episode: {
				id: episodes.id,
				title: episodes.title,
				episodeSlug: episodes.episodeSlug,
				content: episodes.content,
				pubDate: episodes.pubDate,
				image: episodes.image,
				duration: episodes.duration,
				podcastSlug: podcasts.podcastSlug,
				podcastTitle: podcasts.title,
				podcastImage: podcasts.image,
				podcastId: episodes.podcastId,
				podcastAuthor: podcasts.author,
				enclosureUrl: episodes.enclosureUrl,
				explicit: episodes.explicit,
				link: episodes.link,
			},
			podcast: {
				id: podcasts.id,
				title: podcasts.title,
				image: podcasts.image,
				podcastSlug: podcasts.podcastSlug,
			},
		})
		.from(athleteMentions)
		.innerJoin(episodes, eq(athleteMentions.episodeId, episodes.id))
		.innerJoin(podcasts, eq(episodes.podcastId, podcasts.id))
		.where(
			and(
				inArray(
					athleteMentions.id,
					mentionIds.map((m) => m.id),
				),
				like(podcasts.language, "en%"),
			),
		)
		.orderBy(desc(episodes.pubDate), desc(athleteMentions.confidence));
}

export async function getEpisodeAthleteReferences(
	episodeId: string,
	limit = 5,
) {
	// Get the highest confidence mention IDs for each athlete
	const mentionIds = await db.execute<{ id: string }>(sql`
		SELECT DISTINCT ON (athlete_id) id
		FROM athlete_mentions
		WHERE episode_id = ${episodeId}
		ORDER BY athlete_id, confidence DESC
		LIMIT ${limit}
	`);

	// Fetch the full details for these mentions
	return await db.query.athleteMentions.findMany({
		where: inArray(
			athleteMentions.id,
			mentionIds.map((m) => m.id),
		),
		with: {
			athlete: {
				columns: {
					id: true,
					name: true,
					imageUrl: true,
					slug: true,
					bio: true,
				},
			},
		},
		orderBy: [desc(athleteMentions.confidence)],
	});
}

export async function getAthleteById(athleteId: string) {
	return await db.query.athletes.findFirst({
		where: eq(athletes.id, athleteId),
	});
}

export async function getAthleteBySlug(slug: string) {
	return await db.query.athletes.findFirst({
		where: eq(athletes.slug, slug),
	});
}

export async function getAthleteData(slug: string) {
	// console.log("Attempting to fetch athlete with slug:", slug);

	const athlete = await db.query.athletes.findFirst({
		where: eq(athletes.slug, slug),
		with: {
			honors: true,
			results: true,
			sponsors: true,
			gear: true,
			events: true,
		},
	});

	if (!athlete) return null;
	return athlete;
}

export async function getAllAthletes() {
	return await db
		.select({ slug: athletes.slug })
		.from(athletes)
		.where(isNotNull(athletes.slug));
}

export async function getOlympicGoldMedalists() {
	return await db
		.select({
			id: athletes.id,
		})
		.from(athletes)
		.innerJoin(
			athleteHonors,
			and(
				eq(athletes.id, athleteHonors.athleteId),
				ilike(athleteHonors.categoryName, "%olympic%"),
				sql`${athleteHonors.categoryName} NOT ILIKE '%youth%'`,
				eq(athleteHonors.place, "1."),
			),
		)
		.orderBy(desc(athletes.name));
}

interface GetAthletesQueryParams {
	fromDate: string;
	limit: number;
	offset: number;
	goldMedalistIds: string[];
}

export async function getAllAthletesWithDisciplines({
	fromDate,
	limit,
	offset,
	goldMedalistIds,
}: GetAthletesQueryParams) {
	const quotedIds = goldMedalistIds.map((id) => `'${id}'`).join(",");

	return db
		.select({
			athlete: athletes,
			disciplines: sql<string[]>`
			  array_agg(DISTINCT ${athleteResults.discipline})
			  FILTER (
				WHERE ${athleteResults.discipline} NOT ILIKE '%short track%'
				AND ${athleteResults.discipline} NOT ILIKE '%relay%'
				AND ${athleteResults.date} >= ${fromDate}::date
			  )
			`,
		})
		.from(athletes)
		.leftJoin(athleteResults, eq(athletes.id, athleteResults.athleteId))
		.groupBy(athletes.id)
		.orderBy(
			sql`CASE WHEN ${athletes.id} IN (${sql.raw(
				quotedIds,
			)}) THEN 0 ELSE 1 END`,
			desc(athletes.name),
		)
		.limit(limit)
		.offset(offset);
}

export async function getAthleteCount() {
	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(athletes);
	return count;
}

import { db } from "@/db/client";
import { athleteMentions, episodes, podcasts } from "@/db/schema";
import {
	desc,
	eq,
	sql,
	and,
	inArray,
	type InferSelectModel,
	like,
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

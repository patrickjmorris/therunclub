import { db } from "@/db/client";
import { podcastRankings } from "@/db/schema";

const TADDY_API_URL = "https://api.taddy.org/";
const TADDY_USER_ID = process.env.TADDY_USER_ID;
const TADDY_API_KEY = process.env.TADDY_API_KEY;

// Types based on the GraphQL query and expected response
interface TaddyPodcastSeries {
	uuid: string;
	itunesId: number | null; // itunesId can sometimes be null
	name: string;
}

interface TaddyTopChartsResponse {
	data: {
		getTopChartsByGenres: {
			topChartsId: string;
			podcastSeries: TaddyPodcastSeries[];
		};
	};
	errors?: Array<{ message: string }>; // Optional errors array
}

/**
 * Fetches the top ranked running podcasts from the Taddy API.
 * Uses the PODCASTSERIES_SPORTS_RUNNING genre.
 * @returns {Promise<TaddyPodcastSeries[]>} A promise that resolves to an array of top podcast series.
 * @throws {Error} If the API call fails or returns errors.
 */
export async function fetchTopRunningPodcasts(): Promise<TaddyPodcastSeries[]> {
	if (!TADDY_USER_ID || !TADDY_API_KEY) {
		throw new Error(
			"Taddy API credentials (TADDY_USER_ID, TADDY_API_KEY) are not configured in environment variables.",
		);
	}

	const query = `
    {
      getTopChartsByGenres(
        taddyType: PODCASTSERIES,
        genres: PODCASTSERIES_SPORTS_RUNNING
      ){
        topChartsId,
        podcastSeries {
          uuid,
          itunesId,
          name
        }
      }
    }
  `;

	try {
		const response = await fetch(TADDY_API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-User-ID": TADDY_USER_ID,
				"X-API-Key": TADDY_API_KEY,
			},
			body: JSON.stringify({ query }),
			// Add caching strategy if desired, e.g., revalidate every week
			next: { revalidate: 60 * 60 * 24 * 7 }, // Revalidate weekly
		});

		if (!response.ok) {
			const errorBody = await response.text();
			throw new Error(
				`Taddy API request failed with status ${response.status}: ${errorBody}`,
			);
		}

		const result: TaddyTopChartsResponse = await response.json();

		if (result.errors) {
			console.error("Taddy API returned errors:", result.errors);
			throw new Error(
				`Taddy API returned errors: ${result.errors
					.map((e) => e.message)
					.join(", ")}`,
			);
		}

		if (!result.data?.getTopChartsByGenres?.podcastSeries) {
			console.error("Unexpected Taddy API response structure:", result);
			throw new Error("Unexpected response structure from Taddy API.");
		}

		// Return only the top 10 as requested
		return result.data.getTopChartsByGenres.podcastSeries.slice(0, 10);
	} catch (error) {
		console.error("Error fetching top running podcasts from Taddy:", error);
		// Re-throw the error to be handled by the caller
		throw error;
	}
}

/**
 * Fetches the latest top running podcasts from Taddy API and updates the podcast_rankings table.
 * Does not delete old rankings, allowing for historical tracking.
 * @returns {Promise<{ inserted: number, totalFetched: number }>} Results of the update operation.
 * @throws {Error} If fetching from Taddy fails or database insertion fails.
 */
export async function updatePodcastRankings(): Promise<{
	inserted: number;
	totalFetched: number;
}> {
	console.log(
		"[Podcast Ranking Update - Taddy Service] Starting update process...",
	);
	try {
		// 1. Fetch data using the function in this service
		const topPodcasts = await fetchTopRunningPodcasts();
		console.log(
			`[Podcast Ranking Update - Taddy Service] Fetched ${topPodcasts.length} podcasts from Taddy.`,
		);

		if (topPodcasts.length === 0) {
			console.warn(
				"[Podcast Ranking Update - Taddy Service] No podcasts returned from Taddy API.",
			);
			return { inserted: 0, totalFetched: 0 };
		}

		// 2. Prepare data for insertion
		const rankingDataToInsert = topPodcasts.map((podcast, index) => ({
			rank: index + 1, // Rank based on position (1-10)
			taddyUuid: podcast.uuid,
			itunesId: podcast.itunesId,
			podcastName: podcast.name,
			// createdAt will be set by default in the database
		}));

		console.log(
			`[Podcast Ranking Update - Taddy Service] Inserting ${rankingDataToInsert.length} records into podcast_rankings...`,
		);

		// 3. Insert into the database
		const result = await db
			.insert(podcastRankings)
			.values(rankingDataToInsert)
			.returning(); // Return the inserted rows

		console.log(
			`[Podcast Ranking Update - Taddy Service] Successfully inserted ${result.length} records.`,
		);

		return {
			inserted: result.length,
			totalFetched: topPodcasts.length,
		};
	} catch (error) {
		console.error(
			"[Podcast Ranking Update - Taddy Service] Error updating podcast rankings:",
			error,
		);
		throw error; // Re-throw to be handled by the API route
	}
}

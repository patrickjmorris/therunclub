import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { db } from "@/db/client";
import { episodes, athletes, athleteMentions, videos } from "@/db/schema";
import { sql } from "drizzle-orm";
import type { Episode } from "@/db/schema";

describe("Database Operations", () => {
	// Setup test database connection
	beforeAll(async () => {
		// Ensure we're using test database
		if (!process.env.DATABASE_URL?.includes("test")) {
			throw new Error("Tests must be run against test database");
		}
	});

	// Clean up after all tests
	afterAll(async () => {
		await db.execute(sql`DROP SCHEMA public CASCADE`);
		await db.execute(sql`CREATE SCHEMA public`);
	});

	// Reset data before each test
	beforeEach(async () => {
		await db.delete(athleteMentions);
		await db.delete(athletes);
		await db.delete(episodes);
		await db.delete(videos);
	});

	describe("Athletes", () => {
		it("should create and retrieve athletes", async () => {
			const athlete = {
				id: "test-athlete",
				name: "Test Athlete",
				slug: "test-athlete",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			await db.insert(athletes).values(athlete);

			const result = await db.query.athletes.findFirst({
				where: (athletes, { eq }) => eq(athletes.id, athlete.id),
			});

			expect(result).toBeDefined();
			expect(result?.name).toBe(athlete.name);
		});

		it("should handle athlete mentions", async () => {
			const athlete = {
				id: "test-athlete",
				name: "Test Athlete",
				slug: "test-athlete",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const episode = {
				id: "test-episode",
				title: "Test Episode",
				slug: "test-episode",
				duration: "30:00",
				podcastId: "test-podcast",
				episodeSlug: "test-episode",
				enclosureUrl: "https://example.com/test.mp3",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			await db.insert(athletes).values(athlete);
			await db.insert(episodes).values(episode);

			const mention = {
				athleteId: athlete.id,
				episodeId: episode.id,
				source: "title" as const,
				confidence: "1.0",
				context: "Test context",
			};

			await db.insert(athleteMentions).values(mention);

			const results = await db.query.athleteMentions.findMany({
				where: (mentions, { eq }) => eq(mentions.athleteId, athlete.id),
				with: {
					athlete: true,
					episode: true,
				},
			});

			expect(results).toHaveLength(1);
			expect(results[0].athlete.name).toBe(athlete.name);
			expect(results[0].episode.title).toBe(episode.title);
		});
	});

	describe("Episodes", () => {
		it("should handle episode creation and updates", async () => {
			const episode = {
				id: "test-episode",
				title: "Test Episode",
				slug: "test-episode",
				duration: "30:00",
				podcastId: "test-podcast",
				episodeSlug: "test-episode",
				enclosureUrl: "https://example.com/test.mp3",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			await db.insert(episodes).values(episode);

			await db
				.update(episodes)
				.set({ title: "Updated Title" })
				.where(sql`id = ${episode.id}`);

			const result = await db.query.episodes.findFirst({
				where: (episodes, { eq }) => eq(episodes.id, episode.id),
			});

			expect(result?.title).toBe("Updated Title");
		});

		it("should handle batch operations", async () => {
			const batchEpisodes = Array.from({ length: 5 }, (_, i) => ({
				id: `test-episode-${i}`,
				title: `Test Episode ${i}`,
				slug: `test-episode-${i}`,
				duration: "30:00",
				podcastId: "test-podcast",
				episodeSlug: `test-episode-${i}`,
				enclosureUrl: "https://example.com/test.mp3",
				createdAt: new Date(),
				updatedAt: new Date(),
			}));

			await db.insert(episodes).values(batchEpisodes);

			await db
				.update(episodes)
				.set({ athleteMentionsProcessed: true })
				.where(sql`id LIKE 'test-episode-%'`);

			const results = await db.query.episodes.findMany({
				where: (episodes, { like }) => like(episodes.id, "test-episode-%"),
			});

			expect(results).toHaveLength(5);
			for (const episode of results) {
				expect(episode.athleteMentionsProcessed).toBe(true);
			}
		});
	});

	describe("Videos", () => {
		it("should handle video operations", async () => {
			const video = {
				id: "test-video",
				title: "Test Video",
				description: "Test Description",
				youtubeVideoId: "test123",
				channelId: "test-channel",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			await db.insert(videos).values(video);

			const result = await db.query.videos.findFirst({
				where: (videos, { eq }) => eq(videos.id, video.id),
			});

			expect(result).toBeDefined();
			expect(result?.title).toBe(video.title);
		});
	});

	describe("Complex Queries", () => {
		it("should handle joins and aggregations", async () => {
			const athlete = {
				id: "test-athlete",
				name: "Test Athlete",
				slug: "test-athlete",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const testEpisodes = Array.from({ length: 3 }, (_, i) => ({
				id: `test-episode-${i}`,
				title: `Test Episode ${i}`,
				slug: `test-episode-${i}`,
				duration: "30:00",
				podcastId: "test-podcast",
				episodeSlug: `test-episode-${i}`,
				enclosureUrl: "https://example.com/test.mp3",
				createdAt: new Date(),
				updatedAt: new Date(),
			}));

			await db.insert(athletes).values(athlete);
			await db.insert(episodes).values(testEpisodes);

			const mentions = testEpisodes.map((episode) => ({
				athleteId: athlete.id,
				episodeId: episode.id,
				source: "title" as const,
				confidence: "1.0",
				context: "Test context",
			}));

			await db.insert(athleteMentions).values(mentions);

			const result = await db
				.select({
					athleteId: athletes.id,
					athleteName: athletes.name,
					mentionCount: sql<number>`count(*)`,
				})
				.from(athletes)
				.leftJoin(
					athleteMentions,
					sql`${athletes.id} = ${athleteMentions.athleteId}`,
				)
				.groupBy(athletes.id, athletes.name)
				.having(sql`count(*) > 0`);

			expect(result).toHaveLength(1);
			expect(result[0].mentionCount).toBe(3);
		});
	});
});

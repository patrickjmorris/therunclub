// import { createClient } from "@supabase/supabase-js";
// import { drizzle } from "drizzle-orm/postgres-js";
// import { eq, and, sql } from "drizzle-orm";
// import postgres from "postgres";
// import Parser from "rss-parser";
// import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
// import { serve } from "std/http/server.ts";

// const LOCK_KEY = "podcast_update_lock";
// const LOCK_TIMEOUT = 5 * 60;
// const BATCH_SIZE = 5; // Number of podcasts to process concurrently

// function slugify(str: string): string {
//   return str
//     .toLowerCase()
//     .replace(/[^a-z0-9]+/g, "-")
//     .replace(/(^-|-$)+/g, "");
// }

// // Define table schemas for Drizzle
// const podcasts = pgTable('podcasts', {
//   id: integer('id').primaryKey(),
//   title: text('title').notNull(),
//   feedUrl: text('feed_url').notNull(),
//   description: text('description'),
//   image: text('image'),
//   author: text('author'),
//   link: text('link'),
//   language: text('language'),
//   lastBuildDate: timestamp('last_build_date'),
//   itunesOwnerName: text('itunes_owner_name'),
//   itunesOwnerEmail: text('itunes_owner_email'),
//   itunesImage: text('itunes_image'),
//   itunesAuthor: text('itunes_author'),
//   itunesSummary: text('itunes_summary'),
//   itunesExplicit: text('itunes_explicit')
// });

// const episodes = pgTable('episodes', {
//   id: text('id').primaryKey(),
//   podcastId: integer('podcast_id').references(() => podcasts.id),
//   title: text('title').notNull(),
//   episodeSlug: text('episode_slug').notNull(),
//   pubDate: timestamp('pub_date').notNull(),
//   content: text('content'),
//   link: text('link'),
//   enclosureUrl: text('enclosure_url'),
//   duration: text('duration'),
//   explicit: text('explicit'),
//   image: text('image'),
//   episodeNumber: integer('episode_number'),
//   season: text('season')
// });

// async function processPodcast(db: ReturnType<typeof drizzle>, podcast: any, parser: Parser) {
//   try {
//     const data = await parser.parseURL(podcast.feedUrl);
    
//     // Prepare episode values for bulk insert
//     const episodeValues = (data.items ?? [])
//       .filter(item => item.guid)
//       .map(item => ({
//         id: item.guid || "",
//         podcastId: podcast.id,
//         title: item.title ?? "",
//         episodeSlug: slugify(item.title ?? ""),
//         pubDate: new Date(item.pubDate ?? Date.now()),
//         content: item.content ?? "",
//         link: item.link ?? "",
//         enclosureUrl: item.enclosure?.url ?? null,
//         duration: item.itunes?.duration ?? "",
//         explicit: item.itunes?.explicit === "yes" ? "yes" : "no",
//         image: item.itunes?.image ?? "",
//         episodeNumber: item.itunes?.episode ? parseInt(item.itunes.episode) : null,
//         season: item.itunes?.season ?? "",
//       }));

//     // Bulk operations
//     await Promise.all([
//       // Update podcast metadata
//       db.update(podcasts)
//         .set({
//           title: data.title ?? "",
//           description: data.description ?? "",
//           image: data.image?.url ?? data.itunes?.image ?? "",
//           author: data.itunes?.author ?? "",
//           link: data.link ?? "",
//           language: data.language ?? "",
//           lastBuildDate: data.lastBuildDate ? new Date(data.lastBuildDate) : null,
//           itunesOwnerName: data.itunes?.owner?.name ?? "",
//           itunesOwnerEmail: data.itunes?.owner?.email ?? "",
//           itunesImage: data.itunes?.image ?? "",
//           itunesAuthor: data.itunes?.author ?? "",
//           itunesSummary: data.itunes?.summary ?? "",
//           itunesExplicit: data.itunes?.explicit === "yes" ? "yes" : "no",
//         })
//         .where(eq(podcasts.id, podcast.id)),

//       // Bulk upsert episodes
//       db.transaction(async (tx) => {
//         if (episodeValues.length > 0) {
//           await tx.insert(episodes)
//             .values(episodeValues)
//             .onConflictDoUpdate({
//               target: episodes.id,
//               set: {
//                 title: sql`EXCLUDED.title`,
//                 episodeSlug: sql`EXCLUDED.episode_slug`,
//                 pubDate: sql`EXCLUDED.pub_date`,
//                 content: sql`EXCLUDED.content`,
//                 link: sql`EXCLUDED.link`,
//                 enclosureUrl: sql`EXCLUDED.enclosure_url`,
//                 duration: sql`EXCLUDED.duration`,
//                 explicit: sql`EXCLUDED.explicit`,
//                 image: sql`EXCLUDED.image`,
//                 episodeNumber: sql`EXCLUDED.episode_number`,
//                 season: sql`EXCLUDED.season`,
//               },
//             });
//         }
//       })
//     ]);

//     return { success: true, podcastId: podcast.id };
//   } catch (error) {
//     console.error(`Error updating podcast ${podcast.title}:`, error);
//     return { success: false, podcastId: podcast.id, error };
//   }
// }

// async function updatePodcastData(db: ReturnType<typeof drizzle>) {
//   const allPodcasts = await db.select().from(podcasts);
//   const parser = new Parser();
//   const results = [];

//   // Process podcasts in batches
//   for (let i = 0; i < allPodcasts.length; i += BATCH_SIZE) {
//     const batch = allPodcasts.slice(i, i + BATCH_SIZE);
//     const batchResults = await Promise.all(
//       batch.map(podcast => processPodcast(db, podcast, parser))
//     );
//     results.push(...batchResults);
//   }

//   return results;
// }

// serve(async (req: Request) => {
//   try {
//     const supabaseClient = createClient(
//       Deno.env.get("SUPABASE_URL") ?? "",
//       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
//       { db: { schema: "public" } }
//     );

//     const { data: lockData } = await supabaseClient
//       .from("kv_store")
//       .select("value")
//       .eq("key", LOCK_KEY)
//       .single();

//     if (lockData?.value === "true") {
//       return new Response(
//         JSON.stringify({ message: "Update already in progress" }),
//         { status: 409, headers: { "Content-Type": "application/json" } }
//       );
//     }

//     await supabaseClient.from("kv_store").upsert({
//       key: LOCK_KEY,
//       value: "true",
//       expires_at: new Date(Date.now() + LOCK_TIMEOUT * 1000).toISOString(),
//     });

//     try {
//       const connectionString = Deno.env.get("DATABASE_URL");
//       if (!connectionString) {
//         throw new Error("DATABASE_URL environment variable is not set");
//       }

//       const client = new Client(connectionString);
//       await client.connect();
//       const db = drizzle(client);

//       const results = await updatePodcastData(db);
//       await client.end();

//       return new Response(
//         JSON.stringify({ 
//           message: "Podcast data updated successfully",
//           results: results
//         }),
//         { status: 200, headers: { "Content-Type": "application/json" } }
//       );
//     } finally {
//       await supabaseClient.from("kv_store").delete().eq("key", LOCK_KEY);
//     }
//   } catch (error) {
//     console.error("Error updating podcast data:", error);
//     return new Response(
//       JSON.stringify({
//         message: "Error updating podcast data",
//         error: error instanceof Error ? error.message : "Unknown error",
//       }),
//       { status: 500, headers: { "Content-Type": "application/json" } }
//     );
//   }
// });

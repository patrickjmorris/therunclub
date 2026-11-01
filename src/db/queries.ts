
import { revalidateTag } from "next/cache";

// Function to revalidate cache
export function revalidatePodcastsAndEpisodes() {
	// Revalidate main tags
	revalidateTag("podcasts", { expire: 0 });
	revalidateTag("episodes", { expire: 0 });

	// Revalidate specific podcast-related tags
	revalidateTag("podcast", { expire: 0 });
	revalidateTag("podcast-by-slug", { expire: 0 });
	revalidateTag("last-ten-episodes", { expire: 0 });
	revalidateTag("last-ten-episodes-by-slug", { expire: 0 });
	revalidateTag("last-episode", { expire: 0 });
	revalidateTag("podcasts-and-last-episodes", { expire: 0 });
	revalidateTag("all-podcasts-with-last-episodes", { expire: 0 });
	revalidateTag("episode-titles", { expire: 0 });
	revalidateTag("episode", { expire: 0 });
	revalidateTag("featured-podcasts", { expire: 0 });
	revalidateTag("podcast-tags", { expire: 0 });
	revalidateTag("new-episodes", { expire: 0 });
}

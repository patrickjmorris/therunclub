import { supabaseAdmin } from "../src/lib/supabase-admin";

async function checkPattern() {
	// Check podcasts folder
	const { data: podcastFiles, error: podcastError } = await supabaseAdmin.storage
		.from("content-images")
		.list("podcasts", { limit: 5 });

	console.log("📁 Podcast images sample:");
	console.log(podcastFiles?.map((f) => f.name));

	// Check episodes folder
	const { data: episodeFiles, error: episodeError } = await supabaseAdmin.storage
		.from("content-images")
		.list("episodes", { limit: 5 });

	console.log("\n📁 Episode images sample:");
	console.log(episodeFiles?.map((f) => f.name));

	// Get public URLs to see the full pattern
	if (podcastFiles && podcastFiles.length > 0) {
		const { data } = supabaseAdmin.storage
			.from("content-images")
			.getPublicUrl(`podcasts/${podcastFiles[0].name}`);
		console.log("\n🔗 Sample podcast URL:", data.publicUrl);
	}

	if (episodeFiles && episodeFiles.length > 0) {
		const { data } = supabaseAdmin.storage
			.from("content-images")
			.getPublicUrl(`episodes/${episodeFiles[0].name}`);
		console.log("🔗 Sample episode URL:", data.publicUrl);
	}

	process.exit(0);
}

checkPattern();

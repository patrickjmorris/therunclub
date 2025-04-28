import { AthleteMentions } from "@/components/athletes/athlete-mentions";
import { MentionError } from "@/components/common/mention-error";
import { getAthleteRecentMentions } from "@/lib/services/athlete-service";

export default async function AthleteMentionsSection({
	athleteId,
}: { athleteId: string }) {
	try {
		const mentions = await getAthleteRecentMentions(athleteId);

		// Server-side debugging
		// console.log("MENTIONS DEBUG (server):", {
		// 	athlete: athleteId,
		// 	totalMentions: mentions.length,
		// 	podcastMentions: mentions.filter((m) => m.contentType === "podcast")
		// 		.length,
		// 	videoMentions: mentions.filter((m) => m.contentType === "video").length,
		// 	firstType: mentions.length > 0 ? mentions[0].contentType : "none",
		// });

		return <AthleteMentions mentions={mentions} />;
	} catch (error) {
		console.error("Error loading athlete mentions:", error);
		return (
			<MentionError
				title="Error Loading Mentions"
				message="Unable to load recent mentions for this athlete."
			/>
		);
	}
}

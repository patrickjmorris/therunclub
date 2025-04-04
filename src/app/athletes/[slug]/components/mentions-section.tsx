import { AthleteMentions } from "@/components/athletes/athlete-mentions";
import { MentionError } from "@/components/common/mention-error";
import { getAthleteRecentMentions } from "@/lib/services/athlete-service";

export default async function AthleteMentionsSection({
	athleteId,
}: { athleteId: string }) {
	try {
		const mentions = await getAthleteRecentMentions(athleteId);
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

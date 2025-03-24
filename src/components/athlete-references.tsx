import { db } from "@/db/client";
import { athleteMentions, athletes } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { AthleteList } from "./athlete-list";

interface AthleteReferencesProps {
	contentId: string;
	contentType: "podcast" | "video";
	title?: string;
}

export async function AthleteReferences({
	contentId,
	contentType,
	title = "Athletes Mentioned",
}: AthleteReferencesProps) {
	console.log("[Debug] Query params:", { contentId, contentType });

	try {
		const mentions = await db
			.select({
				id: athleteMentions.id,
				context: athleteMentions.context,
				confidence: athleteMentions.confidence,
				source: athleteMentions.source,
				athlete: {
					id: athletes.id,
					name: athletes.name,
					imageUrl: athletes.imageUrl,
					slug: athletes.slug,
					bio: athletes.bio,
				},
			})
			.from(athleteMentions)
			.innerJoin(
				athletes,
				eq(athleteMentions.athleteId, athletes.worldAthleticsId),
			)
			.where(
				and(
					eq(athleteMentions.contentId, contentId),
					eq(athleteMentions.contentType, contentType),
				),
			)
			.orderBy(desc(athleteMentions.confidence));

		console.log("[Debug] Found mentions:", mentions.length);
		console.log("[Debug] Sample mention:", mentions[0]);

		if (mentions.length === 0) {
			return null;
		}

		return (
			<div className="space-y-4">
				<h3 className="text-lg font-semibold">{title}</h3>
				<AthleteList mentions={mentions} />
			</div>
		);
	} catch (error) {
		console.error("[AthleteReferences] Error fetching mentions:", error);
		return null;
	}
}

import { type AthleteMention } from "@/lib/queries/athlete-mentions";
import EpisodeEntry from "./podcasts/EpisodeEntry";

interface AthleteMentionsProps {
	mentions: AthleteMention[];
	title?: string;
}

export function AthleteMentions({
	mentions,
	title = "Recent Mentions",
}: AthleteMentionsProps) {
	if (mentions.length === 0) {
		return null;
	}

	return (
		<div className="space-y-4">
			<h3 className="text-lg font-semibold">{title}</h3>
			<div className="grid gap-4">
				{mentions.map((mention) => (
					<EpisodeEntry
						key={mention.id}
						episodeSlug={mention.episode.episodeSlug}
					/>
				))}
			</div>
		</div>
	);
}

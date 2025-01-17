import { type AthleteMention } from "@/lib/queries/athlete-mentions";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { sanitizeHtml } from "@/lib/sanitize";

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
					<Card key={mention.id}>
						<CardContent className="p-4">
							<div className="flex items-start gap-4">
								<Avatar className="h-12 w-12">
									<AvatarImage
										src={mention.episode.podcast.image ?? ""}
										alt={mention.episode.podcast.title}
									/>
									<AvatarFallback>
										{mention.episode.podcast.title.substring(0, 2)}
									</AvatarFallback>
								</Avatar>
								<div className="flex-1 space-y-2">
									<div className="flex items-start justify-between gap-2">
										<div className="space-y-1">
											<Link
												href={`/podcasts/${mention.episode.podcast.podcastSlug}/${mention.episode.episodeSlug}`}
												className="text-lg font-medium hover:underline"
											>
												{mention.episode.title}
											</Link>
											<div className="text-sm text-muted-foreground">
												{mention.episode.podcast.title} •{" "}
												{mention.episode.pubDate &&
													formatDistanceToNow(
														new Date(mention.episode.pubDate),
														{ addSuffix: true },
													)}
											</div>
										</div>
									</div>
									{mention.episode.content && (
										<div className="prose dark:prose-invert line-clamp-3">
											<div
												// biome-ignore lint/security/noDangerouslySetInnerHtml: Sanitized
												dangerouslySetInnerHTML={{
													__html: sanitizeHtml(mention.episode.content ?? ""),
												}}
											/>
										</div>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

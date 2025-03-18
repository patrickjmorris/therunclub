import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Headphones } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FormattedDate } from "@/components/FormattedDate";
import { formatDuration } from "@/lib/formatDuration";

interface MoreContentProps {
	title: string;
	items: Array<{
		id: string;
		title: string;
		thumbnailUrl?: string | null;
		publishedAt?: Date | null;
		duration?: string | null;
		type: "video" | "episode";
		podcastSlug?: string;
		episodeSlug?: string;
		channelTitle?: string;
	}>;
}

export function MoreContent({ title, items }: MoreContentProps) {
	if (!items.length) return null;

	return (
		<section className="w-full py-12">
			<div className="container px-4 md:px-6">
				<h2 className="text-2xl font-bold tracking-tighter mb-8">{title}</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{items.map((item) => (
						<Link
							key={item.id}
							href={
								item.type === "video"
									? `/videos/${item.id}`
									: `/podcasts/${item.podcastSlug}/${item.episodeSlug}`
							}
							className="block transition-transform hover:scale-[1.02]"
						>
							<Card className="border dark:border-slate-800 hover:shadow-md transition-shadow">
								<CardHeader>
									<CardTitle className="line-clamp-2">{item.title}</CardTitle>
								</CardHeader>
								<CardContent>
									{item.type === "video" ? (
										<>
											<div className="relative aspect-video mb-4 rounded-md overflow-hidden">
												<Image
													src={item.thumbnailUrl ?? ""}
													alt={item.title}
													width={365}
													height={205}
													className="object-cover"
												/>
											</div>
											{item.channelTitle && (
												<p className="text-sm text-muted-foreground mb-2">
													{item.channelTitle}
												</p>
											)}
											<div className="flex items-center gap-4 text-sm text-muted-foreground">
												{item.publishedAt && (
													<span className="flex items-center">
														<Clock className="w-4 h-4 mr-1" />
														{formatDistanceToNow(item.publishedAt, {
															addSuffix: true,
														})}
													</span>
												)}
											</div>
										</>
									) : (
										<>
											<div className="rounded-md overflow-hidden mb-4 mx-auto w-48 h-48">
												<Image
													src={item.thumbnailUrl ?? ""}
													alt={item.title}
													width={192}
													height={192}
													className="w-full h-full object-cover"
												/>
											</div>
											{item.publishedAt && item.publishedAt instanceof Date && (
												<FormattedDate
													date={item.publishedAt}
													className="text-sm text-muted-foreground mb-2 block"
												/>
											)}
											<Button className="mt-4 w-full" variant="outline">
												<Headphones className="mr-2 h-4 w-4" />
												Listen Now
											</Button>
										</>
									)}
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			</div>
		</section>
	);
}

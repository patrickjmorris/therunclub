import { Separator } from "@/components/ui/separator";
import { AboutSection } from "@/components/common/about-section";
import { getPodcastBySlug } from "@/lib/services/podcast-service";
import { notFound } from "next/navigation";
import DynamicHeader from "@/components/podcasts/DynamicHeader";

export default async function PodcastLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ podcast: string }>;
}) {
	const resolvedParams = await params;
	// console.log("Podcast Layout - Resolved Params:", resolvedParams);
	const data = await getPodcastBySlug(resolvedParams.podcast);
	// console.log("Podcast Layout - Podcast Data:", data);
	// console.log("Podcast Layout - Podcast Slug:", resolvedParams.podcast);

	if (!data) {
		console.log("Podcast Layout - No data found, returning 404");
		notFound();
	}

	return (
		<div className="min-h-screen">
			<DynamicHeader
				imageUrl={data.image ?? data.itunesImage ?? ""}
				title={data.title}
				vibrantColor={data.vibrantColor ?? "#1e3a8a"}
				podcastSlug={data.podcastSlug ?? ""}
			/>

			<div className="container max-w-7xl pb-8">
				<div className="grid grid-cols-1 lg:grid-cols-[300px_1fr]">
					<aside className="space-y-6">
						<AboutSection description={data.description || ""} />
						<Separator />
						<div className="space-y-2">
							<h3 className="text-sm font-medium text-muted-foreground uppercase">
								Hosted By
							</h3>
							<p className="font-medium">{data.author}</p>
						</div>
					</aside>
					<main>{children}</main>
				</div>
			</div>
		</div>
	);
}

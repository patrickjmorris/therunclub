import { Separator } from "@/components/ui/separator";
import { AboutSection } from "@/components/AboutSection";
import { getPodcastBySlug } from "@/db/queries";
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
	const data = await getPodcastBySlug(resolvedParams.podcast);
	console.log("layout data", data);
	if (!data) {
		notFound();
	}

	return (
		<div className="min-h-screen">
			<DynamicHeader
				imageUrl={data.image ?? ""}
				title={data.title}
				author={data.author ?? ""}
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

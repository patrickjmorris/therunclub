import { getTopTags } from "@/lib/services/tag-service";
import Link from "next/link";
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

export const revalidate = 3600;

export default async function TagsPage() {
	// Get top tags for videos and episodes
	const videoTags = await getTopTags("video", 365, 30); // Get top 30 video tags from the past year
	const episodeTags = await getTopTags("episode", 365, 30); // Get top 30 episode tags from the past year

	return (
		<div className="container px-4 py-12 md:px-6 md:py-24">
			<div className="mb-12">
				<h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
					Content Tags
				</h1>
				<p className="mt-4 text-xl text-muted-foreground">
					Browse content by tags to discover videos and podcasts on specific
					topics
				</p>
			</div>

			{/* Video Tags Section */}
			<section className="mb-16">
				<div className="flex items-center mb-6">
					<Tag className="mr-3 h-6 w-6" />
					<h2 className="text-3xl font-bold">Video Tags</h2>
				</div>

				<div className="flex flex-wrap gap-3">
					{videoTags.map((tag) => (
						<Button
							key={tag.tag}
							variant="outline"
							size="lg"
							asChild
							className="flex items-center gap-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
						>
							<Link href={`/tags/video/${encodeURIComponent(tag.tag)}`}>
								{tag.tag}
								<span className="text-xs bg-muted px-2 py-1 rounded-full dark:bg-slate-700">
									{tag.count}
								</span>
							</Link>
						</Button>
					))}

					{videoTags.length === 0 && (
						<p className="text-muted-foreground">
							No video tags available yet.
						</p>
					)}
				</div>
			</section>

			{/* Episode Tags Section */}
			<section>
				<div className="flex items-center mb-6">
					<Tag className="mr-3 h-6 w-6" />
					<h2 className="text-3xl font-bold">Podcast Episode Tags</h2>
				</div>

				<div className="flex flex-wrap gap-3">
					{episodeTags.map((tag) => (
						<Button
							key={tag.tag}
							variant="outline"
							size="lg"
							asChild
							className="flex items-center gap-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
						>
							<Link href={`/tags/episode/${encodeURIComponent(tag.tag)}`}>
								{tag.tag}
								<span className="text-xs bg-muted px-2 py-1 rounded-full dark:bg-slate-700">
									{tag.count}
								</span>
							</Link>
						</Button>
					))}

					{episodeTags.length === 0 && (
						<p className="text-muted-foreground">
							No episode tags available yet.
						</p>
					)}
				</div>
			</section>
		</div>
	);
}

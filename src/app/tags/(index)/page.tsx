import { Tag } from "lucide-react";
import {
	type TagHub,
	type TagHubType,
	getTagHubs,
	tagHubPath,
} from "@/lib/services/tag-service";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
	title: "Running Topics",
	description:
		"Browse running podcasts and videos by topic: marathon training, trail running, nutrition, gear, and more.",
	path: "/tags",
});

export const dynamic = "force-static";
export const revalidate = 86400;

const SECTIONS: { type: TagHubType; title: string }[] = [
	{ type: "episode", title: "Podcast episode topics" },
	{ type: "video", title: "Video topics" },
];

export default async function TagsPage() {
	const hubs = await getTagHubs();

	return (
		<div className="container px-4 py-12 md:px-6 md:py-24">
			<div className="mb-12 max-w-3xl">
				<h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
					Running Topics
				</h1>
				<p className="mt-4 text-xl text-muted-foreground">
					Every topic with at least 10 podcast episodes or videos, from marathon
					training to trail running. Most covered topics first.
				</p>
			</div>

			{SECTIONS.map(({ type, title }) => (
				<TopicSection
					key={type}
					title={title}
					hubs={hubs.filter((hub) => hub.type === type)}
				/>
			))}
		</div>
	);
}

function TopicSection({ title, hubs }: { title: string; hubs: TagHub[] }) {
	if (hubs.length === 0) return null;
	return (
		<section className="mb-16">
			<div className="flex items-center mb-6">
				<Tag className="mr-3 h-6 w-6" />
				<h2 className="text-3xl font-bold">
					{title}{" "}
					<span className="text-muted-foreground text-xl">({hubs.length})</span>
				</h2>
			</div>
			{/* Plain anchors keep 1,400+ links light in the HTML and RSC payload. */}
			<ul className="columns-2 sm:columns-3 lg:columns-4 gap-6 text-sm [&_li]:py-1 [&_a:hover]:underline [&_small]:text-muted-foreground">
				{hubs.map((hub) => (
					<li key={hub.tag}>
						<a href={tagHubPath(hub)}>{hub.tag}</a> <small>{hub.count}</small>
					</li>
				))}
			</ul>
		</section>
	);
}

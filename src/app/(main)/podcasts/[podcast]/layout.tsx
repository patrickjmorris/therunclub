import Link from "next/link";

import { AboutSection } from "@/components/AboutSection";
import { AudioProvider } from "@/components/AudioProvider";
import { AudioPlayer } from "@/components/player/AudioPlayer";
import { getPodcastMetadata, FEEDS } from "@/lib/episodes";
import { slugify } from "@/lib/utils";
import { Card } from "@/components/ui/card";

function PersonIcon(props: React.ComponentPropsWithoutRef<"svg">) {
	return (
		<svg aria-hidden="true" viewBox="0 0 11 12" {...props}>
			<path d="M5.019 5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm3.29 7c1.175 0 2.12-1.046 1.567-2.083A5.5 5.5 0 0 0 5.019 7 5.5 5.5 0 0 0 .162 9.917C-.39 10.954.554 12 1.73 12h6.578Z" />
		</svg>
	);
}

export default async function PodcastLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: {
		podcast: string;
	};
}) {
	const feed = FEEDS.find((feed) => feed.slug === params.podcast);
	if (feed) {
		const data = await getPodcastMetadata(feed.url);
		return (
			<div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 text-slate-900">
				{/* Left Panel (1/4 width, independently scrollable) */}
				<div className="lg:w-1/4 lg:overflow-y-auto lg:h-screen lg:pt-6 m-2">
					<Card className="bg-slate-50 p-6 lg:min-h-screen">
						<div className="sticky top-0">
							<div className="mb-4">
								<Link
									href={`/podcasts/${slugify(data.title)}`}
									className="relative block w-48 mx-auto overflow-hidden rounded-lg shadow-xl bg-slate-200 shadow-slate-200 sm:w-64 sm:rounded-xl lg:w-auto lg:rounded-2xl"
									aria-label="Homepage"
								>
									<img
										className="w-full"
										src={data.image}
										alt=""
										width={400}
										height={400}
										sizes="(min-width: 1024px) 20rem, (min-width: 640px) 16rem, 12rem"
									/>
									<div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-black/10 sm:rounded-xl lg:rounded-2xl" />
								</Link>
							</div>
							<h2 className="text-2xl font-bold mb-2">{data.title}</h2>
							<AboutSection description={data.description} />
							<div>
								<h3 className="text-sm uppercase text-gray-500 mb-2">
									Hosted By
								</h3>
								<p>{data.author}</p>
							</div>
						</div>
					</Card>
				</div>

				<div className="lg:w-3/4 p-6 space-y-6 overflow-y-auto lg:h-screen">
					{children}
				</div>

				<footer className="mt-auto border-t border-slate-200 bg-slate-50 py-10 pb-40 sm:py-16 sm:pb-32 lg:hidden">
					<div className="px-4 mx-auto sm:px-6 md:max-w-2xl md:px-4">
						<h2 className="flex items-center mt-8 font-mono text-sm font-medium leading-7 text-slate-900">
							<PersonIcon className="w-auto h-3 fill-slate-300" />
							<span className="ml-2.5">Hosted by</span>
						</h2>
						<div className="flex gap-6 mt-2 text-sm font-bold leading-7 text-slate-900">
							{data.author}
						</div>
					</div>
				</footer>
			</div>
		);
	}
}

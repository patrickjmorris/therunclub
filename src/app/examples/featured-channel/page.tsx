import { FeaturedChannel } from "@/components/featured-channel/index";
import { db } from "@/db/client";
import { channels } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { Suspense } from "react";
import LoadingFeaturedChannel from "./loading";

async function getPopularChannelId() {
	const [popularChannel] = await db
		.select({
			id: channels.id,
		})
		.from(channels)
		.orderBy(desc(sql`CAST(${channels.viewCount} AS INTEGER)`))
		.limit(1);

	console.log("Selected popular channel:", popularChannel);
	return popularChannel?.id;
}

export default async function FeaturedChannelPage() {
	const channelId = await getPopularChannelId();
	console.log("Channel ID:", channelId);

	if (!channelId) {
		return (
			<div className="container mx-auto p-4 max-w-2xl">
				<div className="bg-destructive/15 text-destructive p-4 rounded-md">
					No channels found in the database. Please ensure you have seeded the
					database with channel data.
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-4 max-w-2xl">
			<Suspense fallback={<LoadingFeaturedChannel />}>
				<FeaturedChannel channelId={channelId} />
			</Suspense>
		</div>
	);
}

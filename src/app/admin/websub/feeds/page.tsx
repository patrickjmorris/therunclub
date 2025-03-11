import { db } from "@/db/client";
import { podcasts, websubSubscriptions } from "@/db/schema";
import { Podcast, WebSubSubscription } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WebSubFeedsPage() {
	// Get all podcasts with their subscription status
	const podcastsWithSubs = await db
		.select({
			podcast: podcasts,
			subscription: websubSubscriptions,
		})
		.from(podcasts)
		.leftJoin(
			websubSubscriptions,
			eq(podcasts.feedUrl, websubSubscriptions.topic),
		)
		.orderBy(desc(podcasts.updatedAt));

	// Group podcasts by subscription status
	const withActiveSub = podcastsWithSubs.filter(
		(p) => p.subscription && p.subscription.status === "active",
	);
	const withPendingSub = podcastsWithSubs.filter(
		(p) => p.subscription && p.subscription.status === "pending",
	);
	const withExpiredSub = podcastsWithSubs.filter(
		(p) => p.subscription && p.subscription.status === "expired",
	);
	const withoutSub = podcastsWithSubs.filter((p) => !p.subscription);

	return (
		<div className="container py-8">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold">WebSub Feed Management</h1>
				<div className="space-x-2">
					<Link href="/admin/websub">
						<Button variant="outline">Back to WebSub Dashboard</Button>
					</Link>
					<Link href="/api/websub/manage?renewAll=true&action=renew">
						<Button>Renew All Subscriptions</Button>
					</Link>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
				<StatCard
					title="Active Subscriptions"
					value={withActiveSub.length}
					description="Currently active WebSub subscriptions"
					className="bg-green-50 border-green-200"
				/>
				<StatCard
					title="Pending Subscriptions"
					value={withPendingSub.length}
					description="Awaiting verification"
					className="bg-yellow-50 border-yellow-200"
				/>
				<StatCard
					title="Expired Subscriptions"
					value={withExpiredSub.length}
					description="Need renewal"
					className="bg-red-50 border-red-200"
				/>
				<StatCard
					title="Without Subscription"
					value={withoutSub.length}
					description="No WebSub subscription"
					className="bg-gray-50 border-gray-200"
				/>
			</div>

			<div className="space-y-8">
				<FeedTable
					title="Active Subscriptions"
					podcasts={withActiveSub}
					emptyMessage="No active subscriptions found"
				/>

				<FeedTable
					title="Pending Subscriptions"
					podcasts={withPendingSub}
					emptyMessage="No pending subscriptions found"
				/>

				<FeedTable
					title="Expired Subscriptions"
					podcasts={withExpiredSub}
					emptyMessage="No expired subscriptions found"
				/>

				<FeedTable
					title="Podcasts Without Subscription"
					podcasts={withoutSub}
					emptyMessage="All podcasts have subscriptions"
				/>
			</div>
		</div>
	);
}

function FeedTable({
	title,
	podcasts,
	emptyMessage,
}: {
	title: string;
	podcasts: Array<{
		podcast: Podcast;
		subscription: WebSubSubscription | null;
	}>;
	emptyMessage: string;
}) {
	if (podcasts.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-gray-500">{emptyMessage}</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="rounded-md border overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Podcast</TableHead>
								<TableHead>Feed URL</TableHead>
								<TableHead>Last Updated</TableHead>
								<TableHead>Subscription Status</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{podcasts.map(({ podcast, subscription }) => (
								<TableRow key={podcast.id}>
									<TableCell className="font-medium">{podcast.title}</TableCell>
									<TableCell className="max-w-xs truncate">
										{podcast.feedUrl}
									</TableCell>
									<TableCell>
										{podcast.updatedAt &&
											formatDate(podcast.updatedAt as Date | null)}
									</TableCell>
									<TableCell>
										{subscription ? (
											<>
												<StatusBadge status={subscription.status} />
												{subscription.status === "active" &&
													subscription.expiresAt && (
														<div className="text-xs text-gray-500 mt-1">
															Expires{" "}
															{formatDate(
																subscription.expiresAt as Date | null,
															)}
														</div>
													)}
											</>
										) : (
											<Badge variant="outline">None</Badge>
										)}
									</TableCell>
									<TableCell>
										<div className="flex space-x-2">
											<Link
												href={`/api/websub/debug?action=check&feedUrl=${encodeURIComponent(
													podcast.feedUrl,
												)}`}
												target="_blank"
											>
												<Button variant="outline" size="sm">
													Check
												</Button>
											</Link>
											<Link
												href={`/api/websub/debug?action=process&feedUrl=${encodeURIComponent(
													podcast.feedUrl,
												)}`}
												target="_blank"
											>
												<Button size="sm">Process</Button>
											</Link>
											{!subscription && (
												<Link
													href={`/api/content?type=podcasts&podcastId=${podcast.id}`}
													target="_blank"
												>
													<Button
														variant="outline"
														size="sm"
														className="bg-blue-50"
													>
														Subscribe
													</Button>
												</Link>
											)}
											{subscription && (
												<Link
													href={`/api/websub/manage?feedUrl=${encodeURIComponent(
														podcast.feedUrl,
													)}&action=renew`}
													target="_blank"
												>
													<Button
														variant="outline"
														size="sm"
														className="bg-green-50"
													>
														Renew
													</Button>
												</Link>
											)}
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}

function StatusBadge({ status }: { status: string }) {
	switch (status) {
		case "active":
			return <Badge className="bg-green-500">Active</Badge>;
		case "pending":
			return (
				<Badge variant="outline" className="text-yellow-500">
					Pending
				</Badge>
			);
		case "expired":
			return <Badge variant="destructive">Expired</Badge>;
		default:
			return <Badge variant="secondary">{status}</Badge>;
	}
}

function StatCard({
	title,
	value,
	description,
	className,
}: {
	title: string;
	value: number;
	description: string;
	className?: string;
}) {
	return (
		<div className={`rounded-lg border p-4 flex flex-col ${className || ""}`}>
			<h3 className="text-sm font-medium text-gray-500">{title}</h3>
			<p className="text-3xl font-bold mt-1">{value}</p>
			<p className="text-sm text-gray-500 mt-1">{description}</p>
		</div>
	);
}

// Helper function to safely format dates
function formatDate(date: Date | null | undefined): string {
	if (!date) return "N/A";
	return formatDistanceToNow(date, { addSuffix: true });
}

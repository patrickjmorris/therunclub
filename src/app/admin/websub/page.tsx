import { db } from "@/db/client";
import { websubSubscriptions, websubCallbackLogs } from "@/db/schema";
import { desc, eq, and, lt } from "drizzle-orm";
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

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Helper function to safely format dates
function formatDate(date: Date | null | undefined): string {
	if (!date) return "N/A";
	return formatDistanceToNow(date, { addSuffix: true });
}

export default async function WebSubPage() {
	// Get all subscriptions
	const subscriptions = await db
		.select()
		.from(websubSubscriptions)
		.orderBy(desc(websubSubscriptions.updatedAt));

	// Get recent logs
	const recentLogs = await db
		.select()
		.from(websubCallbackLogs)
		.orderBy(desc(websubCallbackLogs.createdAt))
		.limit(20);

	// Calculate stats
	const activeCount = subscriptions.filter(
		(sub) => sub.status === "active",
	).length;
	const pendingCount = subscriptions.filter(
		(sub) => sub.status === "pending",
	).length;
	const expiredCount = subscriptions.filter(
		(sub) => sub.status === "expired",
	).length;

	// Calculate expiring soon (in next 12 hours)
	const now = new Date();
	const expirationThreshold = new Date();
	expirationThreshold.setHours(expirationThreshold.getHours() + 12);
	const expiringSoonCount = subscriptions.filter(
		(sub) => sub.status === "active" && sub.expiresAt < expirationThreshold,
	).length;

	// Calculate notification stats
	const verificationLogs = recentLogs.filter(
		(log) => log.type === "verification",
	);
	const notificationLogs = recentLogs.filter(
		(log) => log.type === "notification",
	);

	return (
		<div className="container py-8">
			<h1 className="text-3xl font-bold mb-6">WebSub Management</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
				<StatCard
					title="Active Subscriptions"
					value={activeCount}
					description="Currently active WebSub subscriptions"
					className="bg-green-50 border-green-200"
				/>
				<StatCard
					title="Pending Subscriptions"
					value={pendingCount}
					description="Awaiting verification"
					className="bg-yellow-50 border-yellow-200"
				/>
				<StatCard
					title="Expired Subscriptions"
					value={expiredCount}
					description="Need renewal"
					className="bg-red-50 border-red-200"
				/>
				<StatCard
					title="Expiring Soon"
					value={expiringSoonCount}
					description="Within next 12 hours"
					className="bg-blue-50 border-blue-200"
				/>
			</div>

			<div className="flex justify-between items-center mb-4">
				<h2 className="text-2xl font-bold">Subscriptions</h2>
				<div className="space-x-2">
					<Link href="/api/websub/manage?renewAll=true&expiringOnly=true&action=renew">
						<Button variant="outline">Renew Expiring</Button>
					</Link>
					<Link href="/api/websub/manage?renewAll=true&action=renew">
						<Button>Renew All</Button>
					</Link>
				</div>
			</div>

			<div className="rounded-md border mb-8 overflow-hidden">
				<Table>
					<TableCaption>
						List of all WebSub subscriptions in the system
					</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead>Topic</TableHead>
							<TableHead>Hub</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Expires</TableHead>
							<TableHead>Last Updated</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{subscriptions.map((subscription) => (
							<TableRow key={subscription.id}>
								<TableCell className="font-medium max-w-xs truncate">
									{subscription.topic}
								</TableCell>
								<TableCell className="max-w-xs truncate">
									{subscription.hub}
								</TableCell>
								<TableCell>
									<StatusBadge status={subscription.status} />
								</TableCell>
								<TableCell>{formatDate(subscription.expiresAt)}</TableCell>
								<TableCell>{formatDate(subscription.updatedAt)}</TableCell>
								<TableCell>
									<Link
										href={`/api/websub/manage?feedUrl=${encodeURIComponent(
											subscription.topic,
										)}&action=renew`}
									>
										<Button variant="outline" size="sm">
											Renew
										</Button>
									</Link>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<h2 className="text-2xl font-bold mb-4">Recent Callback Logs</h2>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
				<StatCard
					title="Verification Requests"
					value={verificationLogs.length}
					description="Recent subscription verifications"
					className="bg-purple-50 border-purple-200"
				/>
				<StatCard
					title="Notification Requests"
					value={notificationLogs.length}
					description="Recent content updates"
					className="bg-indigo-50 border-indigo-200"
				/>
			</div>

			<div className="rounded-md border overflow-hidden">
				<Table>
					<TableCaption>Recent WebSub callback logs</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead>Type</TableHead>
							<TableHead>Topic</TableHead>
							<TableHead>Method</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Time</TableHead>
							<TableHead>Details</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{recentLogs.map((log) => (
							<TableRow key={log.id}>
								<TableCell>
									<Badge
										variant={
											log.type === "notification" ? "default" : "outline"
										}
									>
										{log.type}
									</Badge>
								</TableCell>
								<TableCell className="max-w-xs truncate">{log.topic}</TableCell>
								<TableCell>{log.requestMethod}</TableCell>
								<TableCell>
									<StatusCodeBadge code={log.responseStatus} />
								</TableCell>
								<TableCell>{formatDate(log.createdAt)}</TableCell>
								<TableCell>
									<Link href={`/admin/websub/logs/${log.id}`}>
										<Button variant="outline" size="sm">
											View
										</Button>
									</Link>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
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

function StatusCodeBadge({ code }: { code: number }) {
	if (code >= 200 && code < 300) {
		return <Badge className="bg-green-500">{code}</Badge>;
	}
	if (code >= 300 && code < 400) {
		return <Badge className="bg-blue-500">{code}</Badge>;
	}
	if (code >= 400 && code < 500) {
		return <Badge className="bg-yellow-500">{code}</Badge>;
	}
	if (code >= 500) {
		return <Badge variant="destructive">{code}</Badge>;
	}
	return <Badge variant="outline">{code}</Badge>;
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

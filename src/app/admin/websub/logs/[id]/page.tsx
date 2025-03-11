import { db } from "@/db/client";
import { websubCallbackLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LogDetailPage({
	params,
}: {
	params: { id: string };
}) {
	const id = parseInt(params.id, 10);
	if (Number.isNaN(id)) {
		notFound();
	}

	const [log] = await db
		.select()
		.from(websubCallbackLogs)
		.where(eq(websubCallbackLogs.id, id));

	if (!log) {
		notFound();
	}

	// Parse JSON data
	let requestHeaders = {};
	let requestParams = {};

	try {
		requestHeaders = JSON.parse(log.requestHeaders);
	} catch (error) {
		console.error("Error parsing request headers:", error);
	}

	try {
		if (log.requestParams) {
			requestParams = JSON.parse(log.requestParams);
		}
	} catch (error) {
		console.error("Error parsing request params:", error);
	}

	return (
		<div className="container py-8">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold">WebSub Log Details</h1>
				<Link href="/admin/websub">
					<Button variant="outline">Back to WebSub Dashboard</Button>
				</Link>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
				<Card>
					<CardHeader>
						<CardTitle>Log Information</CardTitle>
					</CardHeader>
					<CardContent>
						<dl className="space-y-2">
							<div>
								<dt className="text-sm font-medium text-gray-500">ID</dt>
								<dd>{log.id}</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-gray-500">Type</dt>
								<dd>
									<Badge
										variant={
											log.type === "notification" ? "default" : "outline"
										}
									>
										{log.type}
									</Badge>
								</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-gray-500">Created</dt>
								<dd>
									{format(log.createdAt, "PPpp")} (
									{formatDistanceToNow(log.createdAt, {
										addSuffix: true,
									})}
									)
								</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-gray-500">Method</dt>
								<dd>{log.requestMethod}</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-gray-500">
									Response Status
								</dt>
								<dd>
									<StatusCodeBadge code={log.responseStatus} />
								</dd>
							</div>
						</dl>
					</CardContent>
				</Card>

				<Card className="md:col-span-2">
					<CardHeader>
						<CardTitle>Topic Information</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div>
								<div className="text-sm font-medium text-gray-500">
									Topic URL
								</div>
								<div className="break-all">{log.topic}</div>
							</div>
							<div>
								<Link
									href={`/api/websub/manage?feedUrl=${encodeURIComponent(
										log.topic,
									)}&action=renew`}
								>
									<Button size="sm">Renew Subscription</Button>
								</Link>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 gap-6">
				{log.type === "verification" &&
					Object.keys(requestParams).length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle>Verification Parameters</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead>
											<tr>
												<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Parameter
												</th>
												<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Value
												</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-gray-200">
											{Object.entries(requestParams).map(([key, value]) => (
												<tr key={key}>
													<td className="px-4 py-2 text-sm font-medium">
														{key}
													</td>
													<td className="px-4 py-2 text-sm break-all">
														{String(value)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</CardContent>
						</Card>
					)}

				<Card>
					<CardHeader>
						<CardTitle>Request Headers</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead>
									<tr>
										<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Header
										</th>
										<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Value
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200">
									{Object.entries(requestHeaders).map(([key, value]) => (
										<tr key={key}>
											<td className="px-4 py-2 text-sm font-medium">{key}</td>
											<td className="px-4 py-2 text-sm break-all">
												{String(value)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>

				{log.requestBody && (
					<Card>
						<CardHeader>
							<CardTitle>Request Body</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
								<pre className="text-sm whitespace-pre-wrap break-all">
									{log.requestBody}
								</pre>
							</div>
						</CardContent>
					</Card>
				)}

				{log.responseBody && (
					<Card>
						<CardHeader>
							<CardTitle>Response Body</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
								<pre className="text-sm whitespace-pre-wrap break-all">
									{log.responseBody}
								</pre>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
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

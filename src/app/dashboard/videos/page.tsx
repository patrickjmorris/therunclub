import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { canManageContent } from "@/lib/auth-utils";
import { VideoImportDialog } from "./components/video-import-dialog";
import { ChannelImportDialog } from "./components/channel-import-dialog";

export const metadata = {
	title: "Video Management",
	description: "Manage YouTube videos in The Run Club",
};

export default async function VideosManagementPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login?redirect=/dashboard/videos");
	}

	// Check if user has permission to manage videos
	const hasPermission = await canManageContent();
	if (!hasPermission) {
		redirect("/dashboard");
	}

	return (
		<div className="max-w-4xl mx-auto py-8">
			<div className="flex justify-between items-center mb-4">
				<div>
					<h1 className="text-2xl font-bold">Video Management</h1>
					<p className="text-muted-foreground">
						Import and manage YouTube videos and channels
					</p>
				</div>
				<div className="flex gap-2">
					<ChannelImportDialog />
					<VideoImportDialog />
				</div>
			</div>
			<Separator className="mb-8" />

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
				<div className="border rounded-lg p-6 bg-card">
					<h2 className="text-xl font-semibold mb-2">Single Videos</h2>
					<p className="text-muted-foreground mb-4">
						Import individual YouTube videos without importing the entire
						channel.
					</p>
					<VideoImportDialog />
				</div>

				<div className="border rounded-lg p-6 bg-card">
					<h2 className="text-xl font-semibold mb-2">YouTube Channels</h2>
					<p className="text-muted-foreground mb-4">
						Import a YouTube channel to automatically import all its videos.
					</p>
					<ChannelImportDialog />
				</div>
			</div>

			{/* Placeholder for video list - to be implemented */}
			<div className="p-12 text-center border rounded-md bg-muted/40">
				<h3 className="text-lg font-medium mb-2">No videos found</h3>
				<p className="text-muted-foreground mb-4">
					Get started by importing a YouTube video or channel.
				</p>
				<div className="flex justify-center gap-4">
					<ChannelImportDialog />
					<VideoImportDialog />
				</div>
			</div>
		</div>
	);
}

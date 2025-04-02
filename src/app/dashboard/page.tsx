import { getProfile } from "@/lib/services/profile-service";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { canManageContent } from "@/lib/auth-utils";

export default async function DashboardPage() {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	// Get profile data using Drizzle
	const profile = await getProfile(user.id);
	const canManage = await canManageContent();

	return (
		<div className="max-w-4xl mx-auto py-12">
			<h1 className="text-2xl font-bold mb-8">
				Welcome back, {profile?.[0]?.fullName || user.email}
			</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
				{canManage && (
					<Link
						href="/dashboard/videos"
						className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
					>
						<h2 className="text-xl font-semibold mb-2">Video Management</h2>
						<p className="text-gray-600">
							Import and manage individual YouTube videos
						</p>
					</Link>
				)}

				{/* Add more dashboard cards here */}
			</div>

			<div className="hidden">
				<code>{JSON.stringify(profile, null, 2)}</code>
				<code>{JSON.stringify(user, null, 2)}</code>
			</div>
		</div>
	);
}

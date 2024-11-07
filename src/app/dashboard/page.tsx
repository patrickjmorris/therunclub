import { getProfile } from "@/db/queries";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
	const supabase = await createClient();

	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (!session) {
		redirect("/login");
	}

	// Get profile data using Drizzle
	const profile = await getProfile(session.user.id);

	return (
		<div className="max-w-4xl mx-auto py-12">
			<h1 className="text-2xl font-bold mb-8">
				Welcome back, {profile?.[0]?.fullName || session.user.email}
			</h1>
			<code>{JSON.stringify(profile, null, 2)}</code>
			{/* Rest of dashboard content */}
		</div>
	);
}

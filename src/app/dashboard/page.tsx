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
	const { data: profile } = await supabase
		.from("profiles")
		.select("*")
		.eq("id", session.user.id)
		.single();

	return (
		<div className="max-w-4xl mx-auto py-12">
			<h1 className="text-2xl font-bold mb-8">
				Welcome back, {profile?.full_name || session.user.email}
			</h1>
			{/* Rest of dashboard content */}
		</div>
	);
}

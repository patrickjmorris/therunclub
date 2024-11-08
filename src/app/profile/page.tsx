import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";
import { getProfile } from "@/db/queries";

export default async function ProfilePage() {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	// Get profile data using Drizzle
	const [profile] = await getProfile(user.id);

	if (!profile) {
		redirect("/login");
	}

	const mappedProfile = {
		id: profile.id,
		fullName: profile.fullName ?? undefined,
		avatarUrl: profile.avatarUrl ?? undefined,
	};

	return (
		<div className="mx-auto max-w-2xl py-12 px-4">
			<h1 className="text-2xl font-bold mb-8">Profile Settings</h1>
			<ProfileForm initialProfile={mappedProfile} />
		</div>
	);
}

import { notFound, redirect } from "next/navigation";
import { canManageContent } from "@/lib/auth-utils";
import { getAthleteData } from "@/lib/services/athlete-service";
import { updateProfile } from "../actions";
import { AthleteEditForm } from "./components/athlete-edit-form"; // We'll create this component next
import { db } from "@/db/client";
import { athletes } from "@/db/schema";
import { eq, isNotNull } from "drizzle-orm";

// Revalidate this page frequently or on demand, as it's dynamic
export const revalidate = 0;

// We might need generateStaticParams if we want editors without JS
// But for an edit page, requiring JS and dynamic rendering is likely fine.
// Consider if SEO or no-JS users are a priority for this *edit* page.

export default async function AthleteEditPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const resolvedParams = await params;
	const [athlete, isAuthorized] = await Promise.all([
		getAthleteData(resolvedParams.slug),
		canManageContent(),
	]);

	if (!isAuthorized) {
		// Redirect non-admins/editors away
		redirect(`/athletes/${resolvedParams.slug}?error=unauthorized`);
		// Or show a specific "Not Authorized" page/component
	}

	if (!athlete) {
		notFound();
	}

	return (
		<main className="min-h-screen bg-gray-50 dark:bg-gray-900/50">
			<div className="container mx-auto py-8 px-4">
				<div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
					<h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
						Edit Athlete: {athlete.name}
					</h1>
					<AthleteEditForm athlete={athlete} updateAction={updateProfile} />
				</div>
			</div>
		</main>
	);
}

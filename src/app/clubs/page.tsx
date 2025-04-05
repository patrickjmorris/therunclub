import { db } from "@/db/client";
import { runningClubs } from "@/db/schema";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClubFilters } from "@/app/clubs/club-filters";
import { getClubsData } from "@/lib/services/club-service";

// This ensures the page and data are generated at build time
export const revalidate = 3600; // Revalidate every hour

export default async function ClubsPage() {
	const { cities, clubs } = await getClubsData();

	return (
		<div className="container py-8">
			<div className="flex justify-between items-center mb-8">
				<div>
					<h1 className="text-3xl font-bold">Running Clubs</h1>
					<p className="text-muted-foreground mt-2">
						Find and join running clubs in your area
					</p>
				</div>
				<Link href="/clubs/add">
					<Button>Add Club</Button>
				</Link>
			</div>

			<ClubFilters cities={cities} initialClubs={clubs} />
		</div>
	);
}

import { db } from "@/db";
import { runningClubs } from "@/db/schema";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClubFilters } from "@/app/clubs/club-filters";
import { Suspense } from "react";

async function getUniqueCities() {
	const clubs = await db.select().from(runningClubs);
	const cities = [...new Set(clubs.map((club) => club.location.city))];
	return cities.sort();
}

export default async function ClubsPage() {
	const cities = await getUniqueCities();

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

			<Suspense>
				<ClubFilters cities={cities} />
			</Suspense>
		</div>
	);
}

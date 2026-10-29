import { Suspense } from "react";
import {
	getOlympicGoldMedalists,
	getWorldChampions,
	getAthletesByCountry,
	getAthleteCountries,
} from "@/lib/services/athlete-service";
import {
	AthleteMentionsSection,
	AthleteMentionsSectionSkeleton,
} from "@/components/athletes/AthleteMentionsSection";
import {
	AthleteRow,
	AthleteRowSkeleton,
} from "@/components/athletes/AthleteRow";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const metadata = pageMetadata({
	title: "Elite Running Athletes",
	description:
		"Profiles of elite track, road, and trail runners: personal bests, honors, results, and the podcasts and videos that mention them.",
	path: "/athletes",
});

export default async function AthletesPage() {
	// Fetch all data concurrently
	const [
		countries,
		olympicChampions,
		worldChampions,
		usaAthletes,
		kenyaAthletes,
		gbAthletes,
		jamaicaAthletes,
	] = await Promise.all([
		getAthleteCountries(),
		getOlympicGoldMedalists(10), // Limit to 10
		getWorldChampions(10), // Limit to 10
		getAthletesByCountry("USA", 10),
		getAthletesByCountry("KEN", 10),
		getAthletesByCountry("GBR", 10),
		getAthletesByCountry("JAM", 10),
	]);

	return (
		<div className="container mx-auto py-8">
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-3xl font-bold dark:text-gray-100">Athletes</h1>
			</div>

			{/* Recently Mentioned Athletes Section */}
			<Suspense fallback={<AthleteMentionsSectionSkeleton />}>
				<AthleteMentionsSection showViewAllLink={false} />
			</Suspense>

			{/* Olympic Champions Row */}
			<Suspense fallback={<AthleteRowSkeleton title="Olympic Champions" />}>
				<AthleteRow title="Olympic Champions" athletes={olympicChampions} />
			</Suspense>

			{/* World Champions Row */}
			<Suspense fallback={<AthleteRowSkeleton title="World Champions" />}>
				<AthleteRow title="World Champions" athletes={worldChampions} />
			</Suspense>

			{/* USA Athletes Row */}
			<Suspense fallback={<AthleteRowSkeleton title="USA Athletes" />}>
				<AthleteRow title="USA Athletes" athletes={usaAthletes} />
			</Suspense>

			{/* Kenyan Athletes Row */}
			<Suspense fallback={<AthleteRowSkeleton title="Kenyan Athletes" />}>
				<AthleteRow title="Kenyan Athletes" athletes={kenyaAthletes} />
			</Suspense>

			{/* GB Athletes Row */}
			<Suspense
				fallback={<AthleteRowSkeleton title="Great Britain Athletes" />}
			>
				<AthleteRow title="Great Britain Athletes" athletes={gbAthletes} />
			</Suspense>

			{/* Jamaican Athletes Row */}
			<Suspense fallback={<AthleteRowSkeleton title="Jamaican Athletes" />}>
				<AthleteRow title="Jamaican Athletes" athletes={jamaicaAthletes} />
			</Suspense>

			<nav aria-label="Athletes by country" className="mb-8">
				<h2 className="text-xl font-semibold mb-4 dark:text-gray-100">
					Browse athletes by country
				</h2>
				<div className="flex flex-wrap gap-2">
					{countries.map((country) => (
						<Link key={country.slug} href={`/athletes/country/${country.slug}`}>
							<Badge variant="outline" className="hover:bg-muted">
								{country.name} ({country.count})
							</Badge>
						</Link>
					))}
				</div>
			</nav>
		</div>
	);
}

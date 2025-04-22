import { Suspense } from "react";
import {
	getOlympicGoldMedalists,
	getWorldChampions,
	getAthletesByCountry,
} from "@/lib/services/athlete-service";
import {
	AthleteMentionsSection,
	AthleteMentionsSectionSkeleton,
} from "@/components/athletes/AthleteMentionsSection";
import {
	AthleteRow,
	AthleteRowSkeleton,
} from "@/components/athletes/AthleteRow";

export default async function AthletesPage() {
	// Fetch all data concurrently
	const [
		olympicChampions,
		worldChampions,
		usaAthletes,
		kenyaAthletes,
		gbAthletes,
		jamaicaAthletes,
	] = await Promise.all([
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
		</div>
	);
}

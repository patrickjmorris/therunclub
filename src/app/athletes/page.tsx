import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { format, subYears } from "date-fns";
import { convertToAlpha2 } from "@/lib/utils/country-codes";
import {
	getAllAthletesWithDisciplines,
	getAthleteCount,
	getOlympicGoldMedalists,
} from "@/lib/services/athlete-service";
const ATHLETES_PER_PAGE = 24;

interface AthletesListProps {
	athletes: {
		id: string;
		name: string;
		slug: string;
		countryName: string | null;
		countryCode: string | null;
		disciplines: string[];
		isOlympicGoldMedalist: boolean;
		imageUrl: string | null;
	}[];
	hasMore: boolean;
	page: number;
}

function getCountryFlag(countryCode: string | null) {
	if (!countryCode) return null;
	const alpha2Code = convertToAlpha2(countryCode);
	const codePoints = alpha2Code
		.toUpperCase()
		.split("")
		.map((char) => 127397 + char.charCodeAt(0));
	return String.fromCodePoint(...codePoints);
}

async function AthletesList({ athletes, hasMore, page }: AthletesListProps) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{athletes.map((athlete) => (
				<Link
					key={athlete.id}
					href={`/athletes/${athlete.slug}`}
					className="block p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
				>
					<div className="flex gap-4">
						{athlete.imageUrl && (
							<div className="relative w-16 h-16 flex-shrink-0">
								<Image
									src={athlete.imageUrl}
									alt={athlete.name}
									fill
									className="object-cover rounded-full"
									sizes="64px"
								/>
							</div>
						)}
						<div className="flex-1">
							<div className="flex items-center gap-2">
								{athlete.countryCode && (
									<span className="text-xl" aria-hidden="true">
										{getCountryFlag(athlete.countryCode)}
									</span>
								)}
								<h2 className="font-semibold dark:text-gray-100">
									{athlete.name}
								</h2>
								{athlete.isOlympicGoldMedalist && (
									<span
										className="text-yellow-500 dark:text-yellow-400"
										title="Olympic Gold Medalist"
									>
										🥇
									</span>
								)}
							</div>
							{athlete.disciplines.length > 0 && (
								<p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
									{athlete.disciplines.join(", ")}
								</p>
							)}
						</div>
					</div>
				</Link>
			))}
		</div>
	);
}

async function getAthletes(page = 1) {
	// console.log(`Getting athletes for page ${page}`);

	// First, get athletes with Olympic gold medals (excluding youth olympics)
	const olympicGoldMedalists = await getOlympicGoldMedalists();
	const goldMedalistIds = olympicGoldMedalists.map((a) => a.id);

	const offset = (page - 1) * ATHLETES_PER_PAGE;
	const fiveYearsAgo = format(subYears(new Date(), 5), "yyyy-MM-dd");

	const [allAthletes, count] = await Promise.all([
		getAllAthletesWithDisciplines({
			fromDate: fiveYearsAgo,
			limit: ATHLETES_PER_PAGE,
			offset,
			goldMedalistIds,
		}),
		getAthleteCount(),
	]);

	return {
		athletes: allAthletes.map(({ athlete, disciplines }) => ({
			id: athlete.id,
			name: athlete.name,
			slug: athlete.slug,
			countryName: athlete.countryName,
			countryCode: athlete.countryCode,
			imageUrl: athlete.imageUrl,
			disciplines: disciplines?.filter(Boolean) || [],
			isOlympicGoldMedalist: goldMedalistIds.includes(athlete.id),
		})),
		hasMore: offset + ATHLETES_PER_PAGE < count,
		page,
	};
}

export default async function AthletesPage({
	searchParams,
}: {
	searchParams: Promise<{ page?: string }>;
}) {
	const { page: pageParam } = await searchParams;
	const page = pageParam ? parseInt(pageParam) : 1;
	const { athletes: athletesList, hasMore } = await getAthletes(page);

	return (
		<div className="container mx-auto py-8 px-4">
			<h1 className="text-3xl font-bold mb-8">Athletes</h1>
			<Suspense fallback={<div>Loading athletes...</div>}>
				<AthletesList athletes={athletesList} hasMore={hasMore} page={page} />
			</Suspense>
		</div>
	);
}

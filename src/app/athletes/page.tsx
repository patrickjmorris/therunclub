import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/db/client";
import { athletes, athleteHonors, athleteResults } from "@/db/schema";
import { desc, eq, and, ilike, sql, gt } from "drizzle-orm";
import { format, subYears } from "date-fns";
import { convertToAlpha2 } from "@/lib/utils/country-codes";
import { Button } from "@/components/ui/button";

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
	console.log(`Getting athletes for page ${page}`);

	// Calculate date 5 years ago and format it to YYYY-MM-DD
	const fiveYearsAgo = format(subYears(new Date(), 5), "yyyy-MM-dd");

	// First, get athletes with Olympic gold medals (excluding youth olympics)
	const olympicGoldMedalists = await db
		.select({
			id: athletes.id,
		})
		.from(athletes)
		.innerJoin(
			athleteHonors,
			and(
				eq(athletes.id, athleteHonors.athleteId),
				ilike(athleteHonors.categoryName, "%olympic%"),
				sql`${athleteHonors.categoryName} NOT ILIKE '%youth%'`,
				eq(athleteHonors.place, "1."),
			),
		)
		.orderBy(desc(athletes.name));

	console.log(
		"Found Olympic gold medalists:",
		olympicGoldMedalists.slice(0, 5),
	);
	const goldMedalistIds = olympicGoldMedalists.map((a) => a.id);
	console.log("Total Olympic gold medalists:", goldMedalistIds.length);

	// Then get all athletes with pagination
	const offset = (page - 1) * ATHLETES_PER_PAGE;

	const quotedIds = goldMedalistIds.map((id) => `'${id}'`).join(",");

	// Get athletes with their disciplines from recent results
	const allAthletes = await db
		.select({
			athlete: athletes,
			disciplines: sql<string[]>`
				array_agg(DISTINCT ${athleteResults.discipline})
				FILTER (
					WHERE ${athleteResults.discipline} NOT ILIKE '%short track%'
					AND ${athleteResults.discipline} NOT ILIKE '%relay%'
					AND ${athleteResults.date} >= ${fiveYearsAgo}::date
				)
			`,
		})
		.from(athletes)
		.leftJoin(athleteResults, eq(athletes.id, athleteResults.athleteId))
		.groupBy(athletes.id)
		.orderBy(
			sql`CASE WHEN ${athletes.id} IN (${sql.raw(
				quotedIds,
			)}) THEN 0 ELSE 1 END`,
			desc(athletes.name),
		)
		.limit(ATHLETES_PER_PAGE)
		.offset(offset);

	// Get total count for pagination
	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(athletes);

	const result = {
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

	return result;
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

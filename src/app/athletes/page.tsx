import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/db/client";
import { athletes, athleteHonors, athleteResults } from "@/db/schema";
import { desc, eq, and, ilike, sql } from "drizzle-orm";
import { format } from "date-fns";
import { convertToAlpha2 } from "@/lib/utils/country-codes";
import { Button } from "@/components/ui/button";

const ATHLETES_PER_PAGE = 24;

interface AthletesListProps {
	athletes: {
		id: string;
		name: string;
		countryName: string | null;
		countryCode: string | null;
		disciplines: string[];
		isOlympicGoldMedalist: boolean;
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
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{athletes.map((athlete) => (
					<Link
						key={athlete.id}
						href={`/athletes/${athlete.id}`}
						className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors relative flex items-start gap-4"
					>
						{athlete.isOlympicGoldMedalist && (
							<div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-100 border border-yellow-300 rounded-full flex items-center justify-center">
								🥇
							</div>
						)}
						<div className="flex-shrink-0">
							<img
								src={`https://storage.googleapis.com/trc-athlete-images/${athlete.id}.webp`}
								alt={athlete.name}
								className="w-16 h-16 object-cover rounded-full"
								loading="lazy"
							/>
						</div>
						<div className="space-y-1.5 min-w-0">
							<h2 className="text-lg font-semibold truncate">{athlete.name}</h2>
							{athlete.countryName && athlete.countryCode && (
								<p className="text-gray-600 flex items-center gap-2 text-sm">
									<span className="text-base" aria-hidden="true">
										{getCountryFlag(athlete.countryCode)}
									</span>
									<span>{athlete.countryName}</span>
								</p>
							)}
							{athlete.disciplines.length > 0 && (
								<p className="text-sm text-gray-500 line-clamp-1">
									{athlete.disciplines.join(", ")}
								</p>
							)}
						</div>
					</Link>
				))}
			</div>
			{hasMore && (
				<div className="flex justify-center mt-8">
					<Link href={`/athletes?page=${page + 1}`}>
						<Button variant="outline">Load More Athletes</Button>
					</Link>
				</div>
			)}
		</div>
	);
}

async function getAthletes(page = 1) {
	console.log(`Getting athletes for page ${page}`);

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

	// Get athletes with their disciplines
	const allAthletes = await db
		.select({
			athlete: athletes,
			disciplines: sql<string[]>`
				array_agg(DISTINCT ${athleteResults.discipline})
				FILTER (
					WHERE ${athleteResults.discipline} NOT ILIKE '%short track%'
					AND ${athleteResults.discipline} NOT ILIKE '%relay%'
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
			...athlete,
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

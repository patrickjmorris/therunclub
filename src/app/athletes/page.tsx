import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/db/client";
import { athletes, athleteHonors } from "@/db/schema";
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
		dateOfBirth: Date | null;
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
						className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors relative"
					>
						{athlete.isOlympicGoldMedalist && (
							<div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-100 border border-yellow-300 rounded-full flex items-center justify-center">
								🥇
							</div>
						)}
						<div className="space-y-2">
							<h2 className="text-xl font-semibold">{athlete.name}</h2>
							{athlete.countryName && athlete.countryCode && (
								<p className="text-gray-600 flex items-center gap-2">
									<span className="text-xl" aria-hidden="true">
										{getCountryFlag(athlete.countryCode)}
									</span>
									<span>{athlete.countryName}</span>
								</p>
							)}
							{athlete.dateOfBirth && (
								<p className="text-sm text-gray-500">
									Born: {format(new Date(athlete.dateOfBirth), "MMMM d, yyyy")}
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
	// First, get athletes with Olympic gold medals
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
				eq(athleteHonors.place, "1"),
			),
		)
		.orderBy(desc(athletes.name));

	const goldMedalistIds = new Set(olympicGoldMedalists.map((a) => a.id));

	// Then get all athletes with pagination
	const offset = (page - 1) * ATHLETES_PER_PAGE;
	const allAthletes = await db.query.athletes.findMany({
		orderBy: [
			// Olympic gold medalists first
			sql`CASE WHEN id = ANY(${
				goldMedalistIds.size > 0 ? Array.from(goldMedalistIds) : [null]
			}) THEN 0 ELSE 1 END`,
			desc(athletes.name),
		],
		limit: ATHLETES_PER_PAGE,
		offset,
	});

	// Get total count for pagination
	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(athletes);

	return {
		athletes: allAthletes.map((athlete) => ({
			...athlete,
			dateOfBirth: athlete.dateOfBirth ? new Date(athlete.dateOfBirth) : null,
			isOlympicGoldMedalist: goldMedalistIds.has(athlete.id),
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

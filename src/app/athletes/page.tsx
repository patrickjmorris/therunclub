import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/db/client";
import { athletes } from "@/db/schema";
import { desc } from "drizzle-orm";
import { format } from "date-fns";
import { convertToAlpha2 } from "@/lib/utils/country-codes";

interface AthletesListProps {
	athletes: {
		id: string;
		name: string;
		countryName: string | null;
		countryCode: string | null;
		dateOfBirth: Date | null;
	}[];
}

function getCountryFlag(countryCode: string | null) {
	if (!countryCode) return null;

	// Convert to alpha-2 code
	const alpha2Code = convertToAlpha2(countryCode);

	// Convert country code to regional indicator symbols
	const codePoints = alpha2Code
		.toUpperCase()
		.split("")
		.map((char) => 127397 + char.charCodeAt(0));
	return String.fromCodePoint(...codePoints);
}

async function AthletesList({ athletes }: AthletesListProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{athletes.map((athlete) => (
				<Link
					key={athlete.id}
					href={`/athletes/${athlete.id}`}
					className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
				>
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
	);
}

async function getAthletes() {
	const results = await db.query.athletes.findMany({
		orderBy: [desc(athletes.name)],
	});

	return results.map((athlete) => ({
		id: athlete.id,
		name: athlete.name,
		countryName: athlete.countryName,
		countryCode: athlete.countryCode,
		dateOfBirth: athlete.dateOfBirth ? new Date(athlete.dateOfBirth) : null,
	}));
}

export default async function AthletesPage() {
	const athletesList = await getAthletes();

	return (
		<div className="container mx-auto py-8 px-4">
			<h1 className="text-3xl font-bold mb-8">Athletes</h1>
			<Suspense fallback={<div>Loading athletes...</div>}>
				<AthletesList athletes={athletesList} />
			</Suspense>
		</div>
	);
}

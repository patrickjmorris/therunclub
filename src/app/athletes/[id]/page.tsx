import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { athletes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { AthleteProfile } from "./athlete-profile";

interface AthletePageProps {
	params: {
		id: string;
	};
}

async function getAthleteData(id: string) {
	const result = await db.query.athletes.findFirst({
		where: eq(athletes.id, id),
		with: {
			results: {
				orderBy: (fields) => [desc(fields.date)],
			},
		},
	});

	if (!result) return null;

	return {
		...result,
		dateOfBirth: result.dateOfBirth ? new Date(result.dateOfBirth) : null,
		results: result.results.map((r) => ({
			id: r.id,
			date: new Date(r.date),
			competitionName: r.competitionName,
			discipline: r.discipline,
			performance: r.performance,
			place: r.place,
			wind: r.wind,
		})),
	};
}

export default async function AthletePage({ params }: AthletePageProps) {
	const athlete = await getAthleteData(params.id);

	if (!athlete) return notFound();

	return (
		<Suspense fallback={<div>Loading...</div>}>
			<AthleteProfile athlete={athlete} />
		</Suspense>
	);
}

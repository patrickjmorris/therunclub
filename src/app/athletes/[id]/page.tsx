import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { athletes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { AthleteProfile } from "./athlete-profile";

interface AthletePageProps {
	params: Promise<{
		id: string;
	}>;
}

async function getAthleteData(id: string) {
	const result = await db.query.athletes.findFirst({
		where: eq(athletes.id, id),
		with: {
			results: {
				orderBy: (fields) => [desc(fields.date)],
			},
			honors: true,
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
		honors: result.honors.map((h) => ({
			id: h.id,
			categoryName: h.categoryName,
			competition: h.competition,
			discipline: h.discipline,
			mark: h.mark,
			place: h.place,
		})),
	};
}

export default async function AthletePage({ params }: AthletePageProps) {
	const { id } = await params;
	const athlete = await getAthleteData(id);

	if (!athlete) return notFound();

	return (
		<Suspense fallback={<div>Loading...</div>}>
			<AthleteProfile athlete={athlete} />
		</Suspense>
	);
}

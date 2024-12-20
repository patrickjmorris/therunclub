"use client";

import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { convertToAlpha2 } from "@/lib/utils/country-codes";

interface AthleteResult {
	id: string;
	date: Date;
	competitionName: string | null;
	discipline: string;
	performance: string;
	place: string | null;
	wind: string | null;
}

interface AthleteWithResults {
	id: string;
	name: string;
	countryCode: string | null;
	countryName: string | null;
	dateOfBirth: Date | null;
	results: AthleteResult[];
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

function ResultsTable({ results }: { results: AthleteResult[] }) {
	const [showAll, setShowAll] = useState(false);
	const displayResults = showAll ? results : results.slice(0, 5);

	return (
		<div className="space-y-4">
			<div className="overflow-x-auto">
				<table className="min-w-full divide-y divide-gray-200">
					<thead>
						<tr>
							<th className="w-32 px-4 py-2 text-left">Date</th>
							<th className="w-64 px-4 py-2 text-left">Event</th>
							<th className="w-48 px-4 py-2 text-left">Discipline</th>
							<th className="w-32 px-4 py-2 text-left">Performance</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-200">
						{displayResults.map((result) => (
							<tr key={result.id}>
								<td className="w-32 px-4 py-2 whitespace-nowrap">
									{format(new Date(result.date), "MMM d, yyyy")}
								</td>
								<td className="w-64 px-4 py-2">
									{result.competitionName || "-"}
								</td>
								<td className="w-48 px-4 py-2">{result.discipline}</td>
								<td className="w-32 px-4 py-2 whitespace-nowrap">
									{result.performance}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			{results.length > 5 && (
				<div className="flex justify-center mt-4">
					<Button variant="outline" onClick={() => setShowAll(!showAll)}>
						{showAll ? "Show Less" : `Show ${results.length - 5} More Results`}
					</Button>
				</div>
			)}
		</div>
	);
}

export function AthleteProfile({ athlete }: { athlete: AthleteWithResults }) {
	return (
		<div className="container mx-auto py-8">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
				<div className="md:col-span-1">
					<div className="mt-4 space-y-2">
						<h1 className="text-2xl font-bold">{athlete.name}</h1>
						{athlete.countryName && athlete.countryCode && (
							<p className="text-gray-600 flex items-center gap-2">
								<span className="text-xl" aria-hidden="true">
									{getCountryFlag(athlete.countryCode)}
								</span>
								<span>{athlete.countryName}</span>
							</p>
						)}
						{athlete.dateOfBirth && (
							<p className="text-gray-600">
								Born: {format(new Date(athlete.dateOfBirth), "MMMM d, yyyy")}
							</p>
						)}
					</div>
				</div>

				<div className="md:col-span-2">
					<div className="mt-8">
						<h2 className="text-xl font-semibold mb-4">Personal Bests</h2>
						<ResultsTable results={athlete.results} />
					</div>
				</div>
			</div>
		</div>
	);
}

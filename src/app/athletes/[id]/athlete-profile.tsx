"use client";

import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { convertToAlpha2 } from "@/lib/utils/country-codes";
import { Twitter, Instagram, Facebook, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface AthleteResult {
	id: string;
	date: Date;
	competitionName: string | null;
	discipline: string;
	performance: string;
	place: string | null;
	wind: string | null;
}

interface SocialMedia {
	twitter?: string;
	instagram?: string;
	facebook?: string;
	website?: string;
}

interface Honor {
	id: string;
	categoryName: string;
	competition: string;
	discipline: string;
	mark: string | null;
	place: string | null;
}

interface AthleteWithResults {
	id: string;
	name: string;
	countryCode: string | null;
	countryName: string | null;
	dateOfBirth: Date | null;
	bio: string | null;
	socialMedia: SocialMedia | null;
	results: AthleteResult[];
	honors: Honor[];
}

interface MedalCounts {
	gold: number;
	silver: number;
	bronze: number;
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

function SocialLinks({ socialMedia }: { socialMedia: SocialMedia | null }) {
	if (!socialMedia) return null;

	return (
		<div className="flex gap-4">
			{socialMedia.twitter && (
				<a
					href={`https://twitter.com/${socialMedia.twitter}`}
					target="_blank"
					rel="noopener noreferrer"
					className="text-gray-600 hover:text-blue-400 transition-colors"
				>
					<Twitter className="w-5 h-5" />
				</a>
			)}
			{socialMedia.instagram && (
				<a
					href={`https://instagram.com/${socialMedia.instagram}`}
					target="_blank"
					rel="noopener noreferrer"
					className="text-gray-600 hover:text-pink-500 transition-colors"
				>
					<Instagram className="w-5 h-5" />
				</a>
			)}
			{socialMedia.facebook && (
				<a
					href={socialMedia.facebook}
					target="_blank"
					rel="noopener noreferrer"
					className="text-gray-600 hover:text-blue-600 transition-colors"
				>
					<Facebook className="w-5 h-5" />
				</a>
			)}
			{socialMedia.website && (
				<a
					href={socialMedia.website}
					target="_blank"
					rel="noopener noreferrer"
					className="text-gray-600 hover:text-gray-900 transition-colors"
				>
					<Globe className="w-5 h-5" />
				</a>
			)}
		</div>
	);
}

function getMedalColor(place: string | null): string | null {
	if (!place) return null;
	const position = parseInt(place);
	if (position === 1) return "bg-yellow-100 border-yellow-300";
	if (position === 2) return "bg-gray-100 border-gray-300";
	if (position === 3) return "bg-orange-100 border-orange-300";
	return null;
}

function getMedalCounts(honors: Honor[]): Record<string, MedalCounts> {
	return honors.reduce(
		(acc, honor) => {
			if (!honor.place) return acc;

			// Only count Olympics and World Championships, exclude Youth Olympics
			const categoryLower = honor.categoryName.toLowerCase();
			if (
				(!categoryLower.includes("olympic") ||
					categoryLower.includes("youth")) &&
				!categoryLower.includes("world championships")
			) {
				return acc;
			}

			if (!acc[honor.categoryName]) {
				acc[honor.categoryName] = { gold: 0, silver: 0, bronze: 0 };
			}

			const position = parseInt(honor.place);
			if (position === 1) acc[honor.categoryName].gold++;
			if (position === 2) acc[honor.categoryName].silver++;
			if (position === 3) acc[honor.categoryName].bronze++;

			return acc;
		},
		{} as Record<string, MedalCounts>,
	);
}

function MedalCount({
	count,
	type,
}: { count: number; type: "gold" | "silver" | "bronze" }) {
	if (count === 0) return null;

	const colors = {
		gold: "bg-yellow-100 text-yellow-800 border-yellow-300",
		silver: "bg-gray-100 text-gray-800 border-gray-300",
		bronze: "bg-orange-100 text-orange-800 border-orange-300",
	};

	return (
		<div
			className={cn(
				"px-3 py-1 rounded-full border text-sm font-medium inline-flex items-center gap-1",
				colors[type],
			)}
		>
			<span>{count}</span>
			<span>{type[0].toUpperCase() + type.slice(1)}</span>
		</div>
	);
}

function getOrdinalSuffix(place: string): string {
	const num = parseInt(place);
	if (num === 1) return "st";
	if (num === 2) return "nd";
	if (num === 3) return "rd";
	return "th";
}

function HonorsSection({ honors }: { honors: Honor[] }) {
	const [showAllPerformances, setShowAllPerformances] = useState(false);

	if (honors.length === 0) return null;

	const medalCounts = getMedalCounts(honors);
	if (Object.keys(medalCounts).length === 0) return null;

	// Filter honors for major championships and sort by place
	const majorHonors = honors
		.filter((honor) => {
			const categoryLower = honor.categoryName.toLowerCase();
			const isMajorChampionship =
				(categoryLower.includes("olympic") &&
					!categoryLower.includes("youth")) ||
				categoryLower.includes("world championships");

			const hasMedal = honor.place && parseInt(honor.place) <= 3;

			return isMajorChampionship && hasMedal;
		})
		.sort((a, b) => {
			// First sort by category (Olympics before World Championships)
			const isOlympicsA = a.categoryName.toLowerCase().includes("olympic");
			const isOlympicsB = b.categoryName.toLowerCase().includes("olympic");
			if (isOlympicsA && !isOlympicsB) return -1;
			if (!isOlympicsA && isOlympicsB) return 1;

			// Extract years from competition names
			const yearA = parseInt(a.competition.match(/\d{4}/)?.[0] || "0");
			const yearB = parseInt(b.competition.match(/\d{4}/)?.[0] || "0");
			if (yearA !== yearB) return yearB - yearA; // Most recent first

			// If same year, sort by place
			const placeA = parseInt(a.place || "999");
			const placeB = parseInt(b.place || "999");
			return placeA - placeB;
		});

	// Get either all performances or just the last 3
	const displayedHonors = showAllPerformances
		? majorHonors
		: majorHonors.slice(0, 3);

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4">
				<h2 className="text-xl font-semibold">Championship Medals</h2>
				<div className="flex flex-wrap gap-3">
					{Object.entries(medalCounts).map(([category, counts]) => (
						<div
							key={category}
							className="flex flex-col gap-2 p-4 rounded-lg border border-gray-200"
						>
							<h3 className="text-sm font-medium text-gray-600">{category}</h3>
							<div className="flex gap-2">
								<MedalCount count={counts.gold} type="gold" />
								<MedalCount count={counts.silver} type="silver" />
								<MedalCount count={counts.bronze} type="bronze" />
							</div>
						</div>
					))}
				</div>
			</div>

			{majorHonors.length > 0 && (
				<div className="space-y-4">
					<h3 className="text-lg font-medium">Medal Performances</h3>
					<div className="grid gap-3">
						{displayedHonors.map((honor) => {
							const medalColor = getMedalColor(honor.place);
							return (
								<div
									key={honor.id}
									className={cn(
										"p-4 rounded-lg border",
										medalColor || "border-gray-200",
									)}
								>
									<div className="flex justify-between items-start">
										<div>
											<h4 className="font-medium">{honor.competition}</h4>
											<p className="text-sm text-gray-600">
												{honor.discipline}
											</p>
										</div>
										<div className="text-right">
											{honor.place && (
												<p className="font-semibold">
													{honor.place.replace(".", "")}
													{getOrdinalSuffix(honor.place.replace(".", ""))} Place
												</p>
											)}
											{honor.mark && (
												<p className="text-sm text-gray-600">{honor.mark}</p>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
					{majorHonors.length > 3 && (
						<div className="flex justify-center">
							<Button
								variant="outline"
								onClick={() => setShowAllPerformances(!showAllPerformances)}
							>
								{showAllPerformances
									? "Show Less"
									: `Show ${majorHonors.length - 3} More Medals`}
							</Button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export function AthleteProfile({ athlete }: { athlete: AthleteWithResults }) {
	// Get unique disciplines excluding short track and relay events
	const disciplines = [
		...new Set(
			athlete.results
				.map((r) => r.discipline)
				.filter(
					(d) =>
						!d.toLowerCase().includes("short track") &&
						!d.toLowerCase().includes("relay"),
				),
		),
	];

	return (
		<div className="container mx-auto py-8">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
				<div className="md:col-span-1">
					<div className="mt-4 space-y-4">
						<h1 className="text-2xl font-bold">{athlete.name}</h1>
						{athlete.countryName && athlete.countryCode && (
							<p className="text-gray-600 flex items-center gap-2">
								<span className="text-xl" aria-hidden="true">
									{getCountryFlag(athlete.countryCode)}
								</span>
								<span>{athlete.countryName}</span>
							</p>
						)}
						{disciplines.length > 0 && (
							<p className="text-gray-600">Events: {disciplines.join(", ")}</p>
						)}
						{athlete.bio && (
							<div className="prose prose-sm max-w-none">
								<p className="text-gray-600">{athlete.bio}</p>
							</div>
						)}
						{athlete.socialMedia && (
							<div className="pt-2">
								<SocialLinks socialMedia={athlete.socialMedia} />
							</div>
						)}
					</div>
				</div>

				<div className="md:col-span-2">
					{athlete.honors && athlete.honors.length > 0 && (
						<div className="mb-8">
							<HonorsSection honors={athlete.honors} />
						</div>
					)}

					<div className="mt-8">
						<h2 className="text-xl font-semibold mb-4">Personal Bests</h2>
						<ResultsTable
							results={athlete.results.filter(
								(r) =>
									!r.discipline.toLowerCase().includes("short track") &&
									!r.discipline.toLowerCase().includes("relay"),
							)}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

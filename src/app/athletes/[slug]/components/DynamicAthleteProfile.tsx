"use client";

import { useState } from "react";
import type { athletes, athleteHonors, athleteResults } from "@/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { Skeleton } from "@/components/ui/skeleton";

type Athlete = InferSelectModel<typeof athletes> & {
	honors: InferSelectModel<typeof athleteHonors>[];
	results: InferSelectModel<typeof athleteResults>[];
};

interface DynamicAthleteProfileProps {
	athlete: Athlete;
	isAdmin?: boolean;
}

// Loading state component
function AthleteProfileSkeleton() {
	return (
		<div className="space-y-8">
			{/* Medal counts skeleton */}
			<div className="grid grid-cols-2 gap-4">
				<div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
					<Skeleton className="h-6 w-32 mb-2" />
					<div className="space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-4 w-24" />
					</div>
				</div>
				<div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
					<Skeleton className="h-6 w-40 mb-2" />
					<div className="space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-4 w-24" />
					</div>
				</div>
			</div>

			{/* Personal Bests skeleton */}
			<div className="space-y-4">
				<Skeleton className="h-8 w-40" />
				<div className="space-y-2">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
						>
							<div className="flex justify-between items-start">
								<div className="space-y-2">
									<Skeleton className="h-5 w-32" />
									<Skeleton className="h-4 w-48" />
								</div>
								<div className="text-right space-y-2">
									<Skeleton className="h-5 w-24" />
									<Skeleton className="h-4 w-32" />
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export function DynamicAthleteProfile({
	athlete,
	isAdmin,
}: DynamicAthleteProfileProps) {
	const [showAllHonors, setShowAllHonors] = useState(false);
	const [showAllResults, setShowAllResults] = useState(false);

	// Count Olympic medals
	const olympicMedals = athlete.honors.filter(
		(h) =>
			h.competition.toLowerCase().includes("olympic games") &&
			!h.competition.toLowerCase().includes("youth") &&
			h.place &&
			["1.", "2.", "3."].includes(h.place),
	);

	const olympicGolds = olympicMedals.filter((m) => m.place === "1.").length;
	const olympicSilvers = olympicMedals.filter((m) => m.place === "2.").length;
	const olympicBronzes = olympicMedals.filter((m) => m.place === "3.").length;

	// Count World Championship medals
	const worldMedals = athlete.honors.filter(
		(h) =>
			h.categoryName.toLowerCase().includes("world championships") &&
			h.place &&
			["1.", "2.", "3."].includes(h.place),
	);

	const worldGolds = worldMedals.filter((m) => m.place === "1.").length;
	const worldSilvers = worldMedals.filter((m) => m.place === "2.").length;
	const worldBronzes = worldMedals.filter((m) => m.place === "3.").length;

	// Get personal bests
	const personalBests = athlete.results
		.filter((result) => {
			const isRelay = result.discipline?.toLowerCase().includes("relay");
			const isShortTrack = result.discipline
				?.toLowerCase()
				.includes("short track");
			return !isRelay && !isShortTrack;
		})
		.reduce(
			(acc, result) => {
				if (result.performance && result.discipline) {
					acc[result.discipline] = result.performance;
				}
				return acc;
			},
			{} as Record<string, string>,
		);

	// Filter major championship honors
	const majorHonors = athlete.honors
		.filter(
			(h) =>
				h.competition.toLowerCase().includes("olympic games") ||
				(h.competition.toLowerCase().includes("world championships") &&
					!h.competition.toLowerCase().includes("youth")),
		)
		.sort((a, b) => {
			// Sort by competition (Olympics first, then World Championships)
			const aIsOlympic = a.competition.toLowerCase().includes("olympic");
			const bIsOlympic = b.competition.toLowerCase().includes("olympic");
			if (aIsOlympic && !bIsOlympic) return -1;
			if (!aIsOlympic && bIsOlympic) return 1;

			// Then sort by place (1st, 2nd, 3rd, then others)
			const placeOrder: Record<string, number> = { "1.": 1, "2.": 2, "3.": 3 };
			const aPlaceValue =
				a.place && a.place in placeOrder ? placeOrder[a.place] : 4;
			const bPlaceValue =
				b.place && b.place in placeOrder ? placeOrder[b.place] : 4;
			return aPlaceValue - bPlaceValue;
		});

	const displayedHonors = showAllHonors ? majorHonors : majorHonors.slice(0, 5);

	// Sort results by date and get the 5 most recent
	const sortedResults = [...athlete.results]
		.sort((a, b) => {
			if (!a.date || !b.date) return 0;
			return new Date(b.date).getTime() - new Date(a.date).getTime();
		})
		.filter((result) => {
			const isRelay = result.discipline?.toLowerCase().includes("relay");
			const isShortTrack = result.discipline
				?.toLowerCase()
				.includes("short track");
			return !isRelay && !isShortTrack;
		});

	const recentResults = showAllResults
		? sortedResults
		: sortedResults.slice(0, 5);

	return (
		<div className="space-y-8">
			{/* Medal counts section */}
			<div className="grid grid-cols-2 gap-4">
				{(olympicGolds > 0 || olympicSilvers > 0 || olympicBronzes > 0) && (
					<div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
						<h3 className="text-lg font-semibold mb-2">Olympic Medals</h3>
						<div className="space-y-1">
							{olympicGolds > 0 && (
								<div className="flex justify-between">
									<span className="flex items-center gap-2">
										<span className="inline-block w-4 h-4 rounded-full bg-yellow-400 dark:bg-yellow-500" />
										<span className="dark:text-gray-200">Gold</span>
									</span>
									<span className="dark:text-gray-200">{olympicGolds}</span>
								</div>
							)}
							{olympicSilvers > 0 && (
								<div className="flex justify-between">
									<span className="flex items-center gap-2">
										<span className="inline-block w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-400" />
										<span className="dark:text-gray-200">Silver</span>
									</span>
									<span className="dark:text-gray-200">{olympicSilvers}</span>
								</div>
							)}
							{olympicBronzes > 0 && (
								<div className="flex justify-between">
									<span className="flex items-center gap-2">
										<span className="inline-block w-4 h-4 rounded-full bg-amber-600 dark:bg-amber-700" />
										<span className="dark:text-gray-200">Bronze</span>
									</span>
									<span className="dark:text-gray-200">{olympicBronzes}</span>
								</div>
							)}
						</div>
					</div>
				)}

				{(worldGolds > 0 || worldSilvers > 0 || worldBronzes > 0) && (
					<div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
						<h3 className="text-lg font-semibold mb-2 dark:text-gray-100">
							World Championship Medals
						</h3>
						<div className="space-y-1">
							{worldGolds > 0 && (
								<div className="flex justify-between">
									<span className="flex items-center gap-2">
										<span className="inline-block w-4 h-4 rounded-full bg-yellow-400 dark:bg-yellow-500" />
										<span className="dark:text-gray-200">Gold</span>
									</span>
									<span className="dark:text-gray-200">{worldGolds}</span>
								</div>
							)}
							{worldSilvers > 0 && (
								<div className="flex justify-between">
									<span className="flex items-center gap-2">
										<span className="inline-block w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-400" />
										<span className="dark:text-gray-200">Silver</span>
									</span>
									<span className="dark:text-gray-200">{worldSilvers}</span>
								</div>
							)}
							{worldBronzes > 0 && (
								<div className="flex justify-between">
									<span className="flex items-center gap-2">
										<span className="inline-block w-4 h-4 rounded-full bg-amber-600 dark:bg-amber-700" />
										<span className="dark:text-gray-200">Bronze</span>
									</span>
									<span className="dark:text-gray-200">{worldBronzes}</span>
								</div>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Personal Bests section */}
			{sortedResults.length > 0 && (
				<div className="space-y-4">
					<h2 className="text-2xl font-semibold dark:text-gray-100">
						Personal Bests
					</h2>
					<div className="space-y-2">
						{recentResults.map((result) => (
							<div
								key={result.id}
								className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
							>
								<div className="flex justify-between items-start">
									<div className="space-y-1">
										<p className="font-medium dark:text-gray-200">
											{result.discipline}
										</p>
										<p className="text-sm text-gray-600 dark:text-gray-400">
											{result.competitionName}
										</p>
									</div>
									<div className="text-right">
										<p className="font-medium dark:text-gray-200">
											{result.performance}
										</p>
										<p className="text-sm text-gray-600 dark:text-gray-400">
											{new Date(result.date).toLocaleDateString()}
										</p>
									</div>
								</div>
								{result.place && (
									<p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
										Place: {result.place}
									</p>
								)}
								{result.wind && (
									<p className="text-sm text-gray-600 dark:text-gray-400">
										Wind: {result.wind}
									</p>
								)}
							</div>
						))}
						{sortedResults.length > 5 && (
							<button
								type="button"
								onClick={() => setShowAllResults(!showAllResults)}
								className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
							>
								{showAllResults ? "Show Less" : "Show More"}
							</button>
						)}
					</div>
				</div>
			)}

			{/* Major honors section */}
			{majorHonors.length > 0 && (
				<div className="space-y-4">
					<h2 className="text-2xl font-semibold dark:text-gray-100">
						Major Championships
					</h2>
					<div className="space-y-2">
						{displayedHonors.map((honor) => (
							<div
								key={honor.id}
								className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex justify-between items-center"
							>
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										{honor.place && (
											<span
												className={`inline-flex items-center justify-center w-6 h-6 rounded-full border ${
													honor.place === "1."
														? "bg-yellow-400 dark:bg-yellow-500"
														: honor.place === "2."
														  ? "bg-gray-300 dark:bg-gray-400"
														  : "bg-amber-600 dark:bg-amber-700"
												}`}
											>
												{honor.place === "1."
													? "🥇"
													: honor.place === "2."
													  ? "🥈"
													  : "🥉"}
											</span>
										)}
										<p className="font-medium dark:text-gray-200">
											{honor.competition} - {honor.discipline}
										</p>
									</div>
									{honor.mark && (
										<p className="text-sm text-gray-600 dark:text-gray-400">
											{honor.mark}
										</p>
									)}
								</div>
							</div>
						))}
						{majorHonors.length > 5 && (
							<button
								type="button"
								onClick={() => setShowAllHonors(!showAllHonors)}
								className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
							>
								{showAllHonors ? "Show Less" : "Show More"}
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

// Export the loading state component
export { AthleteProfileSkeleton };

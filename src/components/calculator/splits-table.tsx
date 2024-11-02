import React, { useMemo } from "react";
import { timeStringToSeconds, formatTime } from "../../lib/utils/time";

interface SplitsTableProps {
	distance: number; // Total distance in meters
	targetTime: string; // Target time in hh:mm:ss format
	useMetric: boolean; // Whether to display in km or miles
}

export function SplitsTable({
	distance,
	targetTime,
	useMetric,
}: SplitsTableProps) {
	// Calculate split times using memoization to prevent unnecessary recalculations
	const splits = useMemo(() => {
		const totalSeconds = timeStringToSeconds(targetTime);
		const splitDistance = useMetric ? 1000 : 1609.34; // 1km or 1mile
		const totalDistanceInUnits = useMetric
			? distance / 1000
			: distance / 1609.34;
		const fullSplits = Math.floor(totalDistanceInUnits);
		const partialSplit = totalDistanceInUnits - fullSplits;

		// Generate splits array including both full and partial splits
		const splitTimes = [];
		const timePerFullSplit = totalSeconds / totalDistanceInUnits;

		// Add full splits
		for (let i = 1; i <= fullSplits; i++) {
			splitTimes.push({
				number: i,
				distance: useMetric ? `${i}K` : `${i}.0`,
				splitTime: formatTime(timePerFullSplit),
				cumulativeTime: formatTime(timePerFullSplit * i),
			});
		}

		// Add partial split if exists
		if (partialSplit > 0.01) {
			// Account for floating point precision
			splitTimes.push({
				number: splitTimes.length + 1,
				distance: useMetric
					? `${totalDistanceInUnits.toFixed(1)}K`
					: totalDistanceInUnits.toFixed(1),
				splitTime: formatTime(timePerFullSplit * partialSplit),
				cumulativeTime: formatTime(totalSeconds),
			});
		}

		return splitTimes;
	}, [distance, targetTime, useMetric]);

	return (
		<div className="overflow-x-auto -mx-4 sm:mx-0">
			<div className="min-w-full inline-block align-middle">
				<div className="overflow-hidden">
					<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
						<thead>
							<tr className="border-b">
								<th className="px-4 py-2 text-left text-xs sm:text-sm font-medium">
									Split
								</th>
								<th className="px-4 py-2 text-left text-xs sm:text-sm font-medium">
									Distance ({useMetric ? "km" : "mi"})
								</th>
								<th className="px-4 py-2 text-left text-xs sm:text-sm font-medium">
									Split Time
								</th>
								<th className="px-4 py-2 text-left text-xs sm:text-sm font-medium">
									Cumulative
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200 dark:divide-gray-700">
							{splits.map((split) => (
								<tr key={split.number}>
									<td className="px-4 py-2 text-xs sm:text-sm">
										{split.number}
									</td>
									<td className="px-4 py-2 text-xs sm:text-sm">
										{split.distance}
									</td>
									<td className="px-4 py-2 text-xs sm:text-sm font-mono">
										{split.splitTime}
									</td>
									<td className="px-4 py-2 text-xs sm:text-sm font-mono">
										{split.cumulativeTime}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}

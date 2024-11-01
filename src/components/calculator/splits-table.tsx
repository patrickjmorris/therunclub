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
		<div className="overflow-x-auto">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b">
						<th className="text-left py-2">Split</th>
						<th className="text-left py-2">
							Distance ({useMetric ? "km" : "mi"})
						</th>
						<th className="text-left py-2">Split Time</th>
						<th className="text-left py-2">Cumulative</th>
					</tr>
				</thead>
				<tbody>
					{splits.map((split) => (
						<tr key={split.number} className="border-b">
							<td className="py-2">{split.number}</td>
							<td className="py-2">{split.distance}</td>
							<td className="py-2 font-mono">{split.splitTime}</td>
							<td className="py-2 font-mono">{split.cumulativeTime}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

import { useMemo } from "react";
import { timeStringToSeconds, formatTime } from "@/lib/utils/time";

interface TrainingZonesProps {
	recentRaceTime: string;
	raceDistance: number;
	useMetric: boolean;
}

// Format seconds per unit distance (mile/km) into mm:ss pace
function formatPaceTime(seconds: number): string {
	if (Number.isNaN(seconds) || seconds <= 0) return "00:00";
	const m = Math.floor(seconds / 60);
	const s = Math.round(seconds % 60); // Round seconds for display
	// Handle rounding up to 60 seconds
	const adjustedSeconds = s === 60 ? 0 : s;
	const adjustedMinutes = s === 60 ? m + 1 : m;
	return `${String(adjustedMinutes).padStart(2, "0")}:${String(
		adjustedSeconds,
	).padStart(2, "0")}`;
}

export function TrainingZones({
	recentRaceTime,
	raceDistance,
	useMetric,
}: TrainingZonesProps) {
	const zones = useMemo(() => {
		const totalSeconds = timeStringToSeconds(recentRaceTime);
		const distanceInUnits = useMetric
			? raceDistance / 1000
			: raceDistance / 1609.34;

		if (
			Number.isNaN(totalSeconds) ||
			totalSeconds <= 0 ||
			Number.isNaN(distanceInUnits) ||
			distanceInUnits <= 0
		) {
			return []; // Return empty if input is invalid
		}

		const basePacePerUnit = totalSeconds / distanceInUnits;

		// Revised zone ranges based on percentage of input race pace
		// Note: Multipliers > 1 mean SLOWER pace, < 1 mean FASTER pace.
		// minMultiplier = Slower end of zone, maxMultiplier = Faster end of zone
		const zoneRanges = [
			{
				name: "Easy/Recovery",
				minMultiplier: 1.4, // 40% slower
				maxMultiplier: 1.2, // 20% slower
				description: "Easy runs, recovery, warm-up/cool-down",
			},
			{
				name: "Endurance/Aerobic",
				minMultiplier: 1.2, // 20% slower
				maxMultiplier: 1.05, // 5% slower
				description: "Long runs, steady pace, builds aerobic base",
			},
			{
				name: "Marathon Pace",
				minMultiplier: 1.05, // 5% slower
				maxMultiplier: 1.0, // Equal to race pace
				description: "Approximates Marathon Pace (relative to input)",
			},
			{
				name: "Threshold",
				minMultiplier: 1.0, // Equal to race pace
				maxMultiplier: 0.95, // 5% faster
				description: "Tempo runs, cruise intervals (~HM to 10k pace)",
			},
			{
				name: "VO2 Max/Interval",
				minMultiplier: 0.95, // 5% faster
				maxMultiplier: 0.9, // 10% faster
				description: "Intervals (~5k to 3k pace)",
			},
		];

		return zoneRanges.map((zone) => {
			const minPaceSeconds = basePacePerUnit * zone.minMultiplier;
			const maxPaceSeconds = basePacePerUnit * zone.maxMultiplier;
			return {
				name: zone.name,
				// Store min/max pace (fastest/slowest)
				minPaceFormatted: formatPaceTime(maxPaceSeconds), // Fastest pace
				maxPaceFormatted: formatPaceTime(minPaceSeconds), // Slowest pace
				description: zone.description,
			};
		});
	}, [recentRaceTime, raceDistance, useMetric]);

	if (zones.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				Enter a valid race time and distance to see training zones.
			</p>
		);
	}

	return (
		<div className="grid gap-3">
			{zones.map((zone) => (
				<div
					key={zone.name}
					className="flex items-center justify-between p-3 border rounded-lg"
				>
					<div>
						<div className="font-medium">{zone.name}</div>
						<div className="text-sm text-muted-foreground">
							{/* Display pace range as Fastest - Slowest */}
							{zone.minPaceFormatted} - {zone.maxPaceFormatted} per{" "}
							{useMetric ? "km" : "mile"}
						</div>
						<div className="text-xs text-muted-foreground mt-1">
							{zone.description}
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

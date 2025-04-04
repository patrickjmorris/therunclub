import { useMemo } from "react";
import { timeStringToSeconds, formatTime } from "@/lib/utils/time";

interface TrainingZonesProps {
	recentRaceTime: string;
	raceDistance: number;
	useMetric: boolean;
}

// Move formatPaceTime outside the component
function formatPaceTime(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TrainingZones({
	recentRaceTime,
	raceDistance,
	useMetric,
}: TrainingZonesProps) {
	// Calculate training zones based on race pace
	const zones = useMemo(() => {
		// Calculate base race pace in seconds per unit distance
		const totalSeconds = timeStringToSeconds(recentRaceTime);
		const distanceInUnits = useMetric
			? raceDistance / 1000
			: raceDistance / 1609.34;
		const basePacePerUnit = totalSeconds / distanceInUnits;

		// Define zone ranges as multipliers of race pace
		const zoneRanges = [
			{
				name: "Recovery",
				minMultiplier: 1.5, // 50% slower than race pace
				maxMultiplier: 1.4, // 40% slower than race pace
				description: "Active Recovery & Easy Runs",
			},
			{
				name: "Endurance",
				minMultiplier: 1.4, // 40% slower
				maxMultiplier: 1.3, // 30% slower
				description: "Long Runs & Base Building",
			},
			{
				name: "Aerobic",
				minMultiplier: 1.3, // 30% slower
				maxMultiplier: 1.2, // 20% slower
				description: "Marathon Pace & Steady Runs",
			},
			{
				name: "Threshold",
				minMultiplier: 1.15, // 15% slower
				maxMultiplier: 1.05, // 5% slower
				description: "Lactate Threshold & Tempo",
			},
			{
				name: "VO2 Max",
				minMultiplier: 1.05, // 5% slower
				maxMultiplier: 0.95, // 5% faster
				description: "High Intensity Intervals",
			},
		];

		return zoneRanges.map((zone) => ({
			name: zone.name,
			min: formatPaceTime(basePacePerUnit * zone.minMultiplier),
			max: formatPaceTime(basePacePerUnit * zone.maxMultiplier),
			description: zone.description,
		}));
	}, [recentRaceTime, raceDistance, useMetric]);

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
							{zone.max} - {zone.min} per {useMetric ? "km" : "mile"}
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

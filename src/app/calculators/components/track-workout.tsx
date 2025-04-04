import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { formatTime, timeStringToSeconds } from "@/lib/utils/time";

interface TrackWorkoutProps {
	targetPace: string; // Target pace per lap in mm:ss format
	intervalDistance: number; // Distance per interval in meters
}

export function TrackWorkout({
	targetPace,
	intervalDistance,
}: TrackWorkoutProps) {
	// Track workout state
	const [laps, setLaps] = useState(0); // Number of completed laps
	const [isRunning, setIsRunning] = useState(false); // Workout timer status

	// Calculate target time for each interval based on pace
	const intervalTime = useMemo(() => {
		const paceSeconds = timeStringToSeconds(targetPace);
		// Convert pace from per 400m to target interval distance
		return (paceSeconds / 400) * intervalDistance;
	}, [targetPace, intervalDistance]);

	return (
		<div className="space-y-4">
			{/* Lap counter display */}
			<div className="flex items-center gap-4">
				<div className="text-4xl font-mono">{laps}</div>
				<div className="space-y-1">
					<div className="font-medium">Laps</div>
					<div className="text-sm text-muted-foreground">
						Total Distance: {((laps * intervalDistance) / 1000).toFixed(2)}km
					</div>
				</div>
			</div>

			{/* Workout controls */}
			<div className="grid grid-cols-2 gap-2">
				<Button
					variant={isRunning ? "secondary" : "default"}
					onClick={() => setIsRunning(!isRunning)}
				>
					{isRunning ? "Pause" : "Start"}
				</Button>
				<Button
					variant="outline"
					onClick={() => {
						setLaps(laps + 1);
						// TODO: Add lap time tracking logic
					}}
				>
					Lap ({intervalDistance}m)
				</Button>
			</div>

			{/* Target pace display */}
			<div className="text-sm">Target Lap Time: {formatTime(intervalTime)}</div>
		</div>
	);
}

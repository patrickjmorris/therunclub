"use client";

import { useState, useEffect } from "react";
import { calculateTimeLeft } from "@/lib/utils/event-helpers";

interface RaceCountdownProps {
	startTime?: string | null; // Accept potentially null/undefined start time
}

export function RaceCountdown({ startTime }: RaceCountdownProps) {
	const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(startTime));

	useEffect(() => {
		// Only run if startTime is valid
		if (!startTime) return;

		const timer = setInterval(() => {
			setTimeLeft(calculateTimeLeft(startTime));
		}, 1000);

		// Cleanup function to clear the interval when the component unmounts
		// or when startTime changes
		return () => clearInterval(timer);
	}, [startTime]);

	// Only render if there's a valid start time and time remaining
	if (
		!startTime ||
		(timeLeft.days <= 0 &&
			timeLeft.hours <= 0 &&
			timeLeft.minutes <= 0 &&
			timeLeft.seconds <= 0)
	) {
		return null; // Don't render the countdown if time is up or no start time
	}

	return (
		<div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
			<h3 className="font-bold text-slate-800 mb-3">Race Day Countdown</h3>
			<div className="grid grid-cols-4 gap-2 mb-2">
				{[
					{ label: "Days", value: timeLeft.days },
					{ label: "Hours", value: timeLeft.hours },
					{ label: "Mins", value: timeLeft.minutes },
					{ label: "Secs", value: timeLeft.seconds },
				].map(({ label, value }) => (
					<div
						key={label}
						className="bg-white rounded-lg p-2 text-center border border-slate-200"
					>
						<div className="text-2xl font-bold text-rose-500">{value}</div>
						<div className="text-xs text-slate-500">{label}</div>
					</div>
				))}
			</div>
		</div>
	);
}

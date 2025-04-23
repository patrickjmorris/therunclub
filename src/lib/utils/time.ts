// Convert time string (mm:ss, hh:mm:ss, mm:ss.d, hh:mm:ss.d) to total seconds
export function timeStringToSeconds(timeStr: string): number {
	if (!timeStr) return 0;

	// Allow for optional decimal in seconds
	const parts = timeStr.split(":");
	// Declare variables separately
	let hours = 0;
	let minutes = 0;
	let seconds = 0;

	if (parts.length === 3) {
		// hh:mm:ss.d format
		hours = Number.parseFloat(parts[0]);
		minutes = Number.parseFloat(parts[1]);
		seconds = Number.parseFloat(parts[2]);
	} else if (parts.length === 2) {
		// mm:ss.d format
		minutes = Number.parseFloat(parts[0]);
		seconds = Number.parseFloat(parts[1]);
	} else {
		// Invalid format or only seconds?
		// Try parsing as just seconds.d for flexibility, though unlikely for pace/time
		seconds = Number.parseFloat(timeStr);
	}

	// Check for NaN results from parseFloat
	if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds)) {
		return 0; // Or throw an error? Return 0 for now.
	}

	return hours * 3600 + minutes * 60 + seconds;
}

// Format seconds to mm:ss or hh:mm:ss (only use hh if over 60 minutes)
export function formatTime(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);

	// Only show hours if 60 minutes or more
	if (h > 0) {
		return `${h}:${m.toString().padStart(2, "0")}:${s
			.toString()
			.padStart(2, "0")}`;
	}
	return `${m}:${s.toString().padStart(2, "0")}`;
}

// Calculate VDOT (VO2max estimate) using Daniels' Running Formula
export function calculateVDOT(raceDistance: number, raceTime: number): number {
	// Calculate velocity in meters per second
	const velocity = raceDistance / raceTime;

	// Calculate percent of VO2max using Daniels' formula
	const percentVO2Max = -4.6 + 0.182258 * velocity + 0.000104 * velocity ** 2;

	// Apply correction factors based on race duration
	return (
		percentVO2Max /
		(0.8 +
			0.1894393 * Math.exp(-0.012778 * raceTime) +
			0.2989558 * Math.exp(-0.1932605 * raceTime))
	);
}

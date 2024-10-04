export function formatDuration(duration: string): string {
	// Convert duration to seconds if it's in HH:MM:SS format
	const seconds = duration.includes(":")
		? duration
				.split(":")
				.reduce((acc, time) => 60 * acc + parseInt(time, 10), 0)
		: parseInt(duration, 10);

	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);

	const parts = [];
	if (hours > 0) {
		parts.push(`${hours}h`);
	}
	if (minutes > 0 || hours > 0) {
		parts.push(`${minutes}m`);
	}

	return parts.join(" ");
}

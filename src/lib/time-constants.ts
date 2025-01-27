export const SECONDS_IN_MINUTE = 60;
export const MINUTES_IN_HOUR = 60;
export const HOURS_IN_DAY = 24;

// Helper functions for common durations in seconds
export function hoursToSeconds(hours: number) {
	return hours * MINUTES_IN_HOUR * SECONDS_IN_MINUTE;
}

export function daysToSeconds(days: number) {
	return days * HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE;
}

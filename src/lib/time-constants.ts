export const SECONDS_IN_MINUTE = 60;
export const MINUTES_IN_HOUR = 60;
export const HOURS_IN_DAY = 24;

// Pre-calculated durations in seconds
export const ONE_HOUR_IN_SECONDS = SECONDS_IN_MINUTE * MINUTES_IN_HOUR; // 3600
export const FOUR_HOURS_IN_SECONDS = ONE_HOUR_IN_SECONDS * 4; // 14400
export const ONE_DAY_IN_SECONDS = ONE_HOUR_IN_SECONDS * HOURS_IN_DAY; // 86400

// Helper functions for custom durations
export function hoursToSeconds(hours: number) {
	return hours * MINUTES_IN_HOUR * SECONDS_IN_MINUTE;
}

export function daysToSeconds(days: number) {
	return days * HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE;
}

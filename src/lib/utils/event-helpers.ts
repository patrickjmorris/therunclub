import type {
	RunSignupRace,
	EventDetails,
	RegistrationPeriod,
} from "@/types/runsignup";
import { format, differenceInSeconds, intervalToDuration } from "date-fns";

// --- Date & Time Formatting ---

/**
 * Parses and formats a RunSignup date/time string (MM/DD/YYYY HH:mm).
 * Assumes US/Eastern timezone if not specified, which might be incorrect.
 * TODO: Incorporate the race timezone (raceData.timezone) for accurate parsing.
 */
function parseRunSignupDateTime(dateTimeStr: string): Date | null {
	if (!dateTimeStr) return null;
	// Basic parsing - limitations: assumes MM/DD/YYYY HH:mm format, doesn't handle timezone well.
	try {
		// Attempt to split date and time parts
		const parts = dateTimeStr.split(" ");
		const dateParts = parts[0].split("/");
		const timeParts = parts[1] ? parts[1].split(":") : ["0", "0"]; // Default to 00:00 if no time

		if (dateParts.length === 3 && timeParts.length >= 2) {
			const month = parseInt(dateParts[0], 10) - 1; // Month is 0-indexed
			const day = parseInt(dateParts[1], 10);
			const year = parseInt(dateParts[2], 10);
			const hours = parseInt(timeParts[0], 10);
			const minutes = parseInt(timeParts[1], 10);

			// Construct date - this uses the local timezone of the server!
			return new Date(year, month, day, hours, minutes);
		}
	} catch (e) {
		console.error(`Error parsing date-time string: ${dateTimeStr}`, e);
	}
	return null;
}

export function formatDate(dateTimeStr: string | null | undefined): string {
	if (!dateTimeStr) return "Date TBD";
	const date = parseRunSignupDateTime(dateTimeStr);
	return date ? format(date, "PPP") : "Invalid Date"; // e.g., Oct 18, 2025
}

export function formatTime(dateTimeStr: string | null | undefined): string {
	if (!dateTimeStr) return "Time TBD";
	const date = parseRunSignupDateTime(dateTimeStr);
	return date ? format(date, "p") : "Invalid Time"; // e.g., 9:00 AM
}

// --- Address Formatting ---

export function getFormattedAddress(
	street: string | null | undefined,
	street2: string | null | undefined,
	city: string | null | undefined,
	state: string | null | undefined,
): string {
	const parts = [
		street,
		street2,
		city && state ? `${city}, ${state}` : city || state,
	].filter(Boolean);
	return parts.join(", ") || "Location TBD";
}

// --- Countdown Calculation ---

interface TimeLeft {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
}

export function calculateTimeLeft(
	targetDateTimeStr: string | null | undefined,
): TimeLeft {
	const targetDate = targetDateTimeStr
		? parseRunSignupDateTime(targetDateTimeStr)
		: null;
	const now = new Date();

	if (!targetDate || targetDate <= now) {
		return { days: 0, hours: 0, minutes: 0, seconds: 0 };
	}

	const totalSeconds = differenceInSeconds(targetDate, now);
	const duration = intervalToDuration({ start: 0, end: totalSeconds * 1000 });

	return {
		days: duration.days || 0,
		hours: duration.hours || 0,
		minutes: duration.minutes || 0,
		seconds: duration.seconds || 0,
	};
}

// --- Registration Period & Fee ---

interface CurrentRegistration {
	periodName: string;
	fee: string;
}

/**
 * Finds the currently active registration period based on today's date.
 * Returns the period name (e.g., "Early Bird") and fee.
 */
export function getCurrentRegistrationPeriod(
	periods: RegistrationPeriod[] | undefined,
): CurrentRegistration | null {
	if (!periods || periods.length === 0) {
		return null;
	}

	const now = new Date();
	// Ensure dates are comparable (set time to start of day for opens, end of day for closes)
	const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

	for (const period of periods) {
		const opensDate = parseRunSignupDateTime(period.registration_opens);
		const closesDate = parseRunSignupDateTime(period.registration_closes);

		if (opensDate && closesDate) {
			// Adjust dates for comparison
			const opensStart = new Date(
				opensDate.getFullYear(),
				opensDate.getMonth(),
				opensDate.getDate(),
			);
			const closesEnd = new Date(
				closesDate.getFullYear(),
				closesDate.getMonth(),
				closesDate.getDate(),
				23,
				59,
				59,
				999,
			);

			if (todayStart >= opensStart && now <= closesEnd) {
				// Determine period name (heuristic, may need refinement)
				// Example: Check if it's the first period chronologically
				// For simplicity, just returning a generic name or the first period's name.
				// A better approach would require more context or naming conventions.
				const periodName =
					periods.indexOf(period) === 0 ? "Early Bird" : "Standard"; // Basic naming
				return {
					periodName: periodName, // You might need a more sophisticated way to name periods
					fee: period.race_fee || "N/A",
				};
			}
		}
	}

	return null; // No active period found
}

// --- Event Details Extraction ---

/**
 * Gets the first event from the race's event list.
 * Often, this is the primary event (e.g., the main 5K).
 */
export function getMainEvent(
	raceData: RunSignupRace | null | undefined,
): EventDetails | null {
	return raceData?.events?.[0] || null;
}

/**
 * Extracts a short description, removing HTML tags.
 * TODO: Improve HTML stripping.
 */
export function extractShortDescription(
	details: string | null | undefined,
	maxLength = 150,
): string {
	if (!details) return "No description available.";
	// Basic HTML tag removal (replace with a more robust library if complex HTML is expected)
	const textOnly = details
		.replace(/<[^>]*>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
	if (textOnly.length <= maxLength) {
		return textOnly;
	}
	return `${textOnly.substring(0, maxLength)}...`;
}

// --- T-Shirt/Giveaway Info ---

/**
 * Gets giveaway information from an event, if available.
 */
export function getGiveawayInfo(
	event: EventDetails | null | undefined,
): string | null {
	// The example API response didn't show a dedicated field like 't_shirt_info'.
	// Some races might put this in the 'giveaway' field or just the description.
	// Returning the 'giveaway' field if it exists.
	return event?.giveaway || null;
}

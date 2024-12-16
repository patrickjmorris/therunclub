/**
 * Parses a date string into a Date object or returns null.
 * Handles various date formats including ISO 8601 and RFC 2822.
 */
export function parseDate(dateString: string | null | undefined): Date | null {
	if (!dateString) return null;

	try {
		const date = new Date(dateString);
		// Check if the date is valid
		if (Number.isNaN(date.getTime())) {
			return null;
		}
		return date;
	} catch {
		return null;
	}
}

/**
 * Safely creates a Date object from a string, with a fallback value
 */
export function safeDateParse(
	dateString: string | null | undefined,
	fallback: Date = new Date(),
): Date {
	const parsed = parseDate(dateString);
	return parsed || fallback;
}

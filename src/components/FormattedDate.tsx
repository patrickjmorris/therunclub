const dateFormatter = new Intl.DateTimeFormat("en-US", {
	year: "numeric",
	month: "long",
	day: "numeric",
});

export function FormattedDate({
	date,
	...props
}: React.ComponentPropsWithoutRef<"time"> & { date: Date | string | null }) {
	try {
		const dateObj = date instanceof Date ? date : new Date(date || "");
		if (Number.isNaN(dateObj.getTime())) {
			return null;
		}
		return (
			<time dateTime={dateObj.toISOString()} {...props}>
				{dateFormatter.format(dateObj)}
			</time>
		);
	} catch {
		return null;
	}
}

"use client";

import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface DateRangePickerServerProps {
	initialStartDate?: string;
	initialEndDate?: string;
}

export function DateRangePickerServer({
	initialStartDate,
	initialEndDate,
}: DateRangePickerServerProps) {
	const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
		if (initialStartDate && initialEndDate) {
			try {
				return {
					from: new Date(`${initialStartDate}T00:00:00`),
					to: new Date(`${initialEndDate}T23:59:59`),
				};
			} catch (e) {
				console.error("Error parsing initial date range in picker:", e);
				return undefined;
			}
		}
		return undefined;
	});

	// Hidden inputs need values derived from state
	const startDateValue = dateRange?.from
		? format(dateRange.from, "yyyy-MM-dd")
		: "";
	const endDateValue = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "";

	return (
		<>
			{/* Hidden inputs for form submission */}
			<input type="hidden" name="startDate" value={startDateValue} />
			<input type="hidden" name="endDate" value={endDateValue} />

			{/* The actual picker UI */}
			<DateRangePicker
				range={dateRange}
				onRangeChange={setDateRange}
				className="w-full"
			/>
		</>
	);
}

"use client";

import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Define the form data structure expected by this component AND its parent's form instance
// Ensure this matches the structure in pace-calculator.tsx
interface TimeInputGroupFormData {
	hours: number;
	minutes: number;
	seconds: number;
	distance: number; // Include fields used by parent form logic if needed
	pace?: string; // Include optional fields too
}

interface TimeInputGroupProps {
	// Use the local, matching type definition
	form: UseFormReturn<TimeInputGroupFormData>;
	onTimeChange?: (hours: number, minutes: number, seconds: number) => void;
	className?: string;
}

export function TimeInputGroup({
	form,
	onTimeChange,
	className,
}: TimeInputGroupProps) {
	const { register, watch, setValue } = form;

	// Function to handle input changes and notify parent
	const handleChange = (
		field: "hours" | "minutes" | "seconds",
		value: string,
	) => {
		const numValue = parseInt(value, 10) || 0;
		setValue(field, numValue, { shouldValidate: true, shouldDirty: true });

		if (onTimeChange) {
			// Watch only the necessary fields
			const currentValues = watch(["hours", "minutes", "seconds"]);
			onTimeChange(
				field === "hours" ? numValue : currentValues[0] || 0,
				field === "minutes" ? numValue : currentValues[1] || 0,
				field === "seconds" ? numValue : currentValues[2] || 0,
			);
		}
	};

	return (
		<div className={cn("flex items-end space-x-2", className)}>
			<div className="flex-1 space-y-1">
				<Label htmlFor="hours" className="text-xs">
					H
				</Label>
				<Input
					id="hours"
					type="number"
					min="0"
					placeholder="0"
					{...register("hours", { valueAsNumber: true })}
					onChange={(e) => handleChange("hours", e.target.value)}
					className="text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
				/>
			</div>
			<span className="pb-2">:</span>
			<div className="flex-1 space-y-1">
				<Label htmlFor="minutes" className="text-xs">
					M
				</Label>
				<Input
					id="minutes"
					type="number"
					min="0"
					max="59"
					placeholder="00"
					{...register("minutes", { valueAsNumber: true })}
					onChange={(e) => handleChange("minutes", e.target.value)}
					className="text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
				/>
			</div>
			<span className="pb-2">:</span>
			<div className="flex-1 space-y-1">
				<Label htmlFor="seconds" className="text-xs">
					S
				</Label>
				<Input
					id="seconds"
					type="number"
					min="0"
					max="59"
					placeholder="00"
					{...register("seconds", { valueAsNumber: true })}
					onChange={(e) => handleChange("seconds", e.target.value)}
					className="text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
				/>
			</div>
		</div>
	);
}

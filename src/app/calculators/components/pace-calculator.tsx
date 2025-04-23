"use client";

import React, {
	useState,
	useEffect,
	Dispatch,
	SetStateAction,
	KeyboardEvent,
	useMemo,
} from "react";
import { Calculator, Clock } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { timeStringToSeconds, formatTime } from "@/lib/utils/time";
import { SplitsTable } from "./splits-table";
import { TrainingZones } from "./training-zones";
import { TrackWorkout } from "./track-workout";
import { validateTime, WORLD_RECORDS } from "@/lib/utils/records";
import { useQueryState } from "nuqs";
import { useTimeInput } from "@/hooks/use-time-input";
import { TimeInputTooltip } from "./time-input-tooltip";
import { TimeInputGroup } from "./time-input-group";

// Standard race distances in meters
const DISTANCES = {
	mile: 1609.34,
	"5k": 5000,
	"10k": 10000,
	"half-marathon": 21097.5,
	marathon: 42195,
};

interface PaceCalculatorProps {
	mode: "simple" | "advanced";
}

// Zod schema for time input validation (OLD - to be replaced)
// const timeSchema = z
// 	.string()
// 	.min(1, "Time is required")
// 	.refine((val) => /^[0-9:]+$/.test(val), {
// 		message: "Only numbers and colons are allowed",
// 	})
// 	.refine((val) => /^\\d{1,2}(:\\d{2}){1,2}$/.test(val), {
// 		message: "Use format mm:ss or hh:mm:ss",
// 	})
// 	.refine(
// 		(val) => {
// 			const parts = val.split(":").map(Number);
// 			if (parts.length === 2) {
// 				return parts[1] < 60; // Validate seconds for mm:ss
// 			}
// 			return parts[1] < 60 && parts[2] < 60; // Validate minutes and seconds for hh:mm:ss
// 		},
// 		{
// 			message: "Invalid time: minutes and seconds must be less than 60",
// 		},
// 	);

// Form schema combining time and distance validation
const formSchema = z.object({
	// time: timeSchema, // Remove old time schema
	hours: z.number().int().min(0, "Hours cannot be negative").default(0),
	minutes: z
		.number()
		.int()
		.min(0, "Minutes cannot be negative")
		.max(59, "Minutes must be less than 60")
		.default(0),
	seconds: z
		.number()
		.int()
		.min(0, "Seconds cannot be negative")
		.max(59, "Seconds must be less than 60")
		.default(0),
	distance: z.number().positive("Distance must be greater than 0"),
	pace: z
		.string()
		.optional()
		.refine(
			// Allow mm:ss or mm:ss.d format
			(val) => !val || /^\d{1,2}:\d{2}(?:\.\d)?$/.test(val),
			{ message: "Pace should be mm:ss or mm:ss.d" },
		),
});

export type FormData = z.infer<typeof formSchema>;

export default function PaceCalculator({ mode }: PaceCalculatorProps) {
	// URL state management using nuqs v2
	// Persist metric/imperial preference
	const [useMetric, setUseMetric] = useQueryState("metric", {
		defaultValue: false,
		parse: (value) => value === "true",
		serialize: (value) => value.toString(),
	});

	// Persist active calculator tab
	const [activeTab, setActiveTab] = useQueryState("tab", {
		defaultValue: "race-time",
		parse: (value) => value as "race-time" | "pace-calculator" | "track-splits",
		serialize: (value) => value,
	});

	// Single distance state
	const [selectedDistance, setSelectedDistance] = useQueryState<
		keyof typeof DISTANCES
	>("selectedDistance", {
		defaultValue: "5k",
		parse: (value) => value as keyof typeof DISTANCES,
		serialize: (value) => value,
	});

	// Total time for race - REMOVED
	// const [time, setTime] = useQueryState("time", {
	// 	defaultValue: "",
	// 	parse: (value) => value,
	// 	serialize: (value) => value,
	// });

	// Pace per mile/km - Keep this
	const [pace, setPace] = useQueryState("pace", {
		defaultValue: "",
		parse: (value) => value, // Keep simple parsing for now
		serialize: (value) => value,
	});

	// Initialize form with URL parameter values and persist between modes
	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			// time: time || "", // Remove old time default
			hours: 0, // Default H/M/S to 0
			minutes: 0,
			seconds: 0,
			distance: DISTANCES[selectedDistance],
			pace: pace || "", // Initialize pace from URL
		},
		// Trigger validation on change for immediate feedback
		mode: "onChange",
	});

	// Memoize distance calculation
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	const distanceInMeters = useMemo(() => {
		return DISTANCES[selectedDistance] || 0;
		// Fix: Dependency should be the calculated value if possible, or list the parts
		// Since DISTANCES is constant, depending on selectedDistance is correct.
		// Let's try disabling the lint rule specifically for this line if it persists.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedDistance]); // Linter might incorrectly flag this, keep as is or add DISTANCES if needed.

	// Function to convert H/M/S to a time string "hh:mm:ss" or "mm:ss"
	const getTimeString = (h: number, m: number, s: number): string => {
		const hh = String(h).padStart(2, "0");
		const mm = String(m).padStart(2, "0");
		const ss = String(s).padStart(2, "0");
		if (h > 0) {
			return `${hh}:${mm}:${ss}`;
		}
		return `${mm}:${ss}`;
	};

	// Calculate pace when race time changes (will be adapted later)
	const updatePaceFromRaceTime = (
		hours: number,
		minutes: number,
		seconds: number,
		distance: number,
	) => {
		if (!distance || (hours === 0 && minutes === 0 && seconds === 0)) {
			setPace(""); // Clear pace if time is zero or distance missing
			form.setValue("pace", "");
			return;
		}

		const timeString = getTimeString(hours, minutes, seconds);
		const totalSecondsValue = timeStringToSeconds(timeString);

		if (totalSecondsValue <= 0) {
			setPace("");
			form.setValue("pace", "");
			return;
		}

		const pacePerUnit = useMetric
			? totalSecondsValue / (distance / 1000) // seconds per km
			: totalSecondsValue / (distance / 1609.34); // seconds per mile

		const paceFormatted = formatTime(pacePerUnit, "mm:ss"); // Ensure mm:ss format for pace
		setPace(paceFormatted);
		form.setValue("pace", paceFormatted);
	};

	// Calculate track splits from pace
	const calculateTrackSplits = (paceStr: string) => {
		if (!paceStr) return { "100m": "00:00", "200m": "00:00", "400m": "00:00" };

		const paceSeconds = timeStringToSeconds(paceStr);
		const unitDistance = useMetric ? 1000 : 1609.34;
		const secondsPerMeter = paceSeconds / unitDistance;

		return {
			"100m": formatTime(secondsPerMeter * 100),
			"200m": formatTime(secondsPerMeter * 200),
			"400m": formatTime(secondsPerMeter * 400),
		};
	};

	// Calculate pace from distance and time (Update function signature)
	const calculatePace = (
		distance: number,
		hours: number,
		minutes: number,
		seconds: number,
	) => {
		const totalSeconds = hours * 3600 + minutes * 60 + seconds;
		if (totalSeconds <= 0 || !distance) {
			return { perKm: "00:00", perMile: "00:00" };
		}
		const pacePerKm = totalSeconds / (distance / 1000);
		const pacePerMile = totalSeconds / (distance / 1609.34);

		return {
			perKm: formatTime(pacePerKm, "mm:ss"), // Ensure mm:ss format for pace display
			perMile: formatTime(pacePerMile, "mm:ss"),
		};
	};

	// Calculate finish time from pace and distance (Pace is expected as mm:ss)
	const calculateFinishTime = (pace: string, distance: number) => {
		if (!pace || !distance) return "00:00:00"; // Return hh:mm:ss format
		const [minutes = 0, seconds = 0] = pace.split(":").map(Number);
		const paceInSeconds = minutes * 60 + seconds;
		if (paceInSeconds <= 0) return "00:00:00";
		const totalSeconds =
			(useMetric ? distance / 1000 : distance / 1609.34) * paceInSeconds;
		return formatTime(totalSeconds, "hh:mm:ss"); // Use hh:mm:ss for finish times
	};

	// Format seconds to mm:ss or hh:mm:ss based on parameter
	const formatTime = (
		seconds: number,
		format: "mm:ss" | "hh:mm:ss" = "hh:mm:ss",
	): string => {
		if (Number.isNaN(seconds) || seconds <= 0) {
			return format === "mm:ss" ? "00:00" : "00:00:00";
		}

		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		// Keep higher precision for seconds internally
		const s = seconds % 60;

		if (format === "mm:ss") {
			const totalMinutes = h * 60 + m;
			// Round seconds to 1 decimal place for mm:ss format
			const roundedSeconds = s.toFixed(1);
			const ssValue = String(roundedSeconds).padStart(4, "0"); // Pad to xx.x (e.g., 05.1, 51.9)
			return `${String(totalMinutes).padStart(2, "0")}:${ssValue}`;
		}

		// hh:mm:ss format - round seconds to nearest integer
		const sRounded = Math.round(s);
		const adjustedSeconds = sRounded === 60 ? 0 : sRounded;
		const adjustedMinutes = sRounded === 60 ? m + 1 : m;
		const adjustedHours = adjustedMinutes === 60 ? h + 1 : h;
		const finalMinutes = adjustedMinutes === 60 ? 0 : adjustedMinutes;

		const hh = String(adjustedHours).padStart(2, "0");
		const mm = String(finalMinutes).padStart(2, "0");
		const ssValue = String(adjustedSeconds).padStart(2, "0");
		return `${hh}:${mm}:${ssValue}`;
	};

	// Validate time input against world records (Update function signature)
	const validateTimeInput = (
		hours: number,
		minutes: number,
		seconds: number,
		distance: number,
	) => {
		// Convert H/M/S to total seconds for validation
		const timeInSeconds = hours * 3600 + minutes * 60 + seconds;

		if (timeInSeconds <= 0) {
			form.clearErrors(["hours", "minutes", "seconds"]); // Clear errors if time is 0
			return true; // Allow zero time
		}

		// Find closest standard distance for validation
		const distanceKey = Object.entries(DISTANCES).reduce(
			(closest, [key, value]) => {
				if (
					Math.abs(value - distance) <
					Math.abs(DISTANCES[closest as keyof typeof DISTANCES] - distance)
				) {
					return key as keyof typeof DISTANCES;
				}
				return closest;
			},
			"mile" as keyof typeof DISTANCES,
		);

		const validation = validateTime(distanceKey, timeInSeconds);

		// Map error back to a relevant field (e.g., 'seconds' or a general form error)
		const errorField = "seconds"; // Or consider adding a general form error

		if (!validation.isValid) {
			form.setError(errorField, {
				type: "manual",
				message: validation.message,
			});
			return false;
		}

		if (validation.warning) {
			form.setError(errorField, {
				type: "manual",
				message: validation.warning,
			});
			// Clear previous non-warning errors on the same field if a warning appears
			if (form.formState.errors[errorField]?.type !== "manual") {
				form.clearErrors(errorField);
				form.setError(errorField, {
					type: "manual",
					message: validation.warning,
				});
			}
		} else {
			// Clear manual errors if validation passes or only has default zod errors
			if (form.formState.errors[errorField]?.type === "manual") {
				form.clearErrors(errorField);
			}
		}

		return true;
	};

	// Update pace validation function
	const validatePaceInput = (paceValue: string) => {
		if (!paceValue) return true; // Skip if empty

		// Check format first (already done by zod refine, but belt-and-suspenders)
		if (!/^\d{1,2}:\d{2}(?:\.\d)?$/.test(paceValue)) {
			form.setError("pace", {
				type: "manual",
				message: "Invalid format (mm:ss or mm:ss.d)",
			});
			return false;
		}

		const paceSeconds = timeStringToSeconds(paceValue); // Assumes timeStringToSeconds handles decimals

		const minPaceSeconds = 60; // 1:00 min/unit
		const maxPaceSeconds = 900; // 15:00 min/unit

		if (paceSeconds < minPaceSeconds) {
			form.setError("pace", {
				type: "manual",
				message: `Pace is unrealistically fast (< ${formatTime(
					minPaceSeconds,
					"mm:ss",
				)}/${useMetric ? "km" : "mile"})`,
			});
			return false;
		}

		if (paceSeconds > maxPaceSeconds) {
			form.setError("pace", {
				type: "manual",
				message: `Pace is unrealistically slow (> ${formatTime(
					maxPaceSeconds,
					"mm:ss",
				)}/${useMetric ? "km" : "mile"})`,
			});
			return false;
		}

		if (form.formState.errors.pace?.type === "manual") {
			form.clearErrors("pace");
		}

		return true;
	};

	// Calculate and sync pace across tabs when race time changes (Update signature)
	const syncPaceAcrossTabs = (
		hours: number,
		minutes: number,
		seconds: number,
		raceDistance: number,
	) => {
		try {
			// Only calculate and update if we have valid inputs
			const totalSeconds = hours * 3600 + minutes * 60 + seconds;
			if (totalSeconds <= 0 || !raceDistance) {
				setPace(""); // Clear URL pace state
				form.setValue("pace", ""); // Clear form pace field
				return;
			}

			// Calculate pace for the race
			const calculatedPaceData = calculatePace(
				raceDistance,
				hours,
				minutes,
				seconds,
			);
			const paceValue = useMetric
				? calculatedPaceData.perKm
				: calculatedPaceData.perMile;

			// Update URL state and form state for pace
			setPace(paceValue);
			form.setValue("pace", paceValue);

			// Potentially update other tabs based on activeTab - refined later
			// if (activeTab === 'track-splits') { ... }
		} catch (error) {
			console.error("Error syncing pace:", error);
			// Maybe set a general form error here
		}
	};

	// General blur handler for form-level validation trigger
	const handleBlur = (e: React.FocusEvent<HTMLFormElement>) => {
		const target = e.target;
		if (
			target instanceof HTMLInputElement ||
			target instanceof HTMLSelectElement ||
			target instanceof HTMLTextAreaElement
		) {
			const fieldName = target.name as keyof FormData;
			if (fieldName in form.getValues()) {
				form.trigger(fieldName);
				// Special validation for time group on blur of any input
				if (["hours", "minutes", "seconds"].includes(fieldName)) {
					const { hours, minutes, seconds, distance } = form.getValues();
					if (distance) {
						validateTimeInput(hours, minutes, seconds, distance);
					}
				}
				// NOTE: Pace validation is handled by handlePaceBlur now
			}
		}
	};

	// Specific blur handler for Pace Input validation
	const handlePaceBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		const paceValue = e.target.value;
		form.trigger("pace"); // Trigger zod validation first
		if (paceValue && form.formState.errors.pace === undefined) {
			// Only run custom validation if zod validation passed
			validatePaceInput(paceValue);
		}
	};

	// Update the distance selection handler
	const handleDistanceChange = async (value: string) => {
		const newDistanceKey = value as keyof typeof DISTANCES;
		const newDistanceInMeters = DISTANCES[newDistanceKey];

		await setSelectedDistance(newDistanceKey);
		form.setValue("distance", newDistanceInMeters);

		// Get the current pace (if it exists)
		const currentPaceStr = form.getValues("pace");

		if (currentPaceStr) {
			// If pace exists, recalculate H/M/S for the new distance
			try {
				const paceSecondsPerUnit = timeStringToSeconds(currentPaceStr);
				if (paceSecondsPerUnit > 0) {
					const unitDivisor = useMetric ? 1000 : 1609.34;
					const totalSeconds =
						(newDistanceInMeters / unitDivisor) * paceSecondsPerUnit;

					if (!Number.isNaN(totalSeconds) && totalSeconds > 0) {
						const h = Math.floor(totalSeconds / 3600);
						const m = Math.floor((totalSeconds % 3600) / 60);
						const s = Math.round(totalSeconds % 60);

						const adjustedSeconds = s === 60 ? 0 : s;
						const adjustedMinutes = s === 60 ? m + 1 : m;
						const adjustedHours = adjustedMinutes === 60 ? h + 1 : h;
						const finalMinutes = adjustedMinutes === 60 ? 0 : adjustedMinutes;

						// Update H/M/S fields, trigger validation
						form.setValue("hours", adjustedHours, {
							shouldValidate: true,
							shouldDirty: true,
						});
						form.setValue("minutes", finalMinutes, {
							shouldValidate: true,
							shouldDirty: true,
						});
						form.setValue("seconds", adjustedSeconds, {
							shouldValidate: true,
							shouldDirty: true,
						});

						// Also trigger world record validation for the new time/distance
						validateTimeInput(
							adjustedHours,
							finalMinutes,
							adjustedSeconds,
							newDistanceInMeters,
						);
					} else {
						// If calculation failed, maybe clear H/M/S?
						form.setValue("hours", 0);
						form.setValue("minutes", 0);
						form.setValue("seconds", 0);
					}
				} else {
					// Parsed pace was invalid, maybe clear H/M/S?
					form.setValue("hours", 0);
					form.setValue("minutes", 0);
					form.setValue("seconds", 0);
				}
			} catch (error) {
				console.error("Error recalculating time from pace:", error);
				// Clear H/M/S on error
				form.setValue("hours", 0);
				form.setValue("minutes", 0);
				form.setValue("seconds", 0);
			}
		} else {
			// If no pace exists, don't change H/M/S. Keep the manually entered time.
			// Optionally, we could clear the pace here if we want changing distance
			// without a pace to force a recalculation based on H/M/S later.
			// form.setValue("pace", "");
			// setPace("");
		}

		// Original logic (recalculating pace) is removed.
		// const { hours, minutes, seconds } = form.getValues();
		// syncPaceAcrossTabs(hours, minutes, seconds, newDistanceInMeters);
	};

	// Callback for TimeInputGroup changes
	const handleTimeInputChange = (
		hours: number,
		minutes: number,
		seconds: number,
	) => {
		const distance = form.getValues("distance");
		if (distance) {
			syncPaceAcrossTabs(hours, minutes, seconds, distance);
		}
		// Optionally trigger world record validation immediately on change
		// if (distance) {
		// 	validateTimeInput(hours, minutes, seconds, distance);
		// }
	};

	// Effect to sync URL pace state back to form pace field
	React.useEffect(() => {
		const currentFormPace = form.getValues("pace");
		if (pace && pace !== currentFormPace) {
			form.setValue("pace", pace, { shouldValidate: true });
		}
		// Restore form method dependencies
	}, [pace, form.getValues, form.setValue]);

	// Effect to initialize H/M/S from URL pace and distance on load
	React.useEffect(() => {
		if (!pace || !distanceInMeters) return;

		const { hours, minutes, seconds } = form.getValues();
		if (hours !== 0 || minutes !== 0 || seconds !== 0) return;

		try {
			const paceSecondsPerUnit = timeStringToSeconds(pace);
			if (paceSecondsPerUnit <= 0) return;

			const unitDivisor = useMetric ? 1000 : 1609.34;
			const totalSeconds =
				(distanceInMeters / unitDivisor) * paceSecondsPerUnit;

			if (Number.isNaN(totalSeconds) || totalSeconds <= 0) return;

			const h = Math.floor(totalSeconds / 3600);
			const m = Math.floor((totalSeconds % 3600) / 60);
			const s = Math.round(totalSeconds % 60);

			const adjustedSeconds = s === 60 ? 0 : s;
			const adjustedMinutes = s === 60 ? m + 1 : m;
			const adjustedHours = adjustedMinutes === 60 ? h + 1 : h;
			const finalMinutes = adjustedMinutes === 60 ? 0 : adjustedMinutes;

			form.setValue("hours", adjustedHours, {
				shouldDirty: false,
				shouldValidate: false,
			});
			form.setValue("minutes", finalMinutes, {
				shouldDirty: false,
				shouldValidate: false,
			});
			form.setValue("seconds", adjustedSeconds, {
				shouldDirty: false,
				shouldValidate: false,
			});
		} catch (error) {
			console.error("Error calculating initial H/M/S from URL params:", error);
		}
		// Restore form method dependencies, use memoized distance
	}, [pace, distanceInMeters, useMetric, form.setValue, form.getValues]);

	// Placeholder onSubmit - might not be needed if calculations happen onChange/onBlur
	const onSubmit = (data: FormData) => {
		console.log("Form submitted (optional):", data);
		// Trigger final validation and pace sync on explicit submit if needed
		if (data.distance) {
			if (
				validateTimeInput(data.hours, data.minutes, data.seconds, data.distance)
			) {
				syncPaceAcrossTabs(
					data.hours,
					data.minutes,
					data.seconds,
					data.distance,
				);
			}
		}
	};

	// Keep paceInput hook for the Pace field
	const paceInput = useTimeInput({
		setValue: (fieldName, value) => form.setValue(fieldName as "pace", value),
		fieldName: "pace",
		initialValue: pace || "00:00", // Ensure "00:00" format
		// format: "mm:ss", // Remove format, handled internally by hook now
	});

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Calculator className="w-6 h-6" />
					Running Pace Calculator
				</CardTitle>
				<CardDescription>
					Calculate your running pace, finish times, and splits
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					// General blur capture for H/M/S fields
					onBlurCapture={handleBlur}
				>
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center space-x-2">
							<Label htmlFor="metric">Use Metric (Kilometers)</Label>
							<Switch
								id="metric"
								checked={useMetric}
								onCheckedChange={setUseMetric}
							/>
						</div>
					</div>

					<Tabs
						defaultValue={activeTab}
						value={activeTab}
						onValueChange={(value) => setActiveTab(value)}
					>
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="race-time">Race Time</TabsTrigger>
							<TabsTrigger value="pace-calculator">Pace Calculator</TabsTrigger>
							<TabsTrigger value="track-splits">Track Splits</TabsTrigger>
						</TabsList>

						<TabsContent value="race-time" className="space-y-4">
							<div className="grid gap-4">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="flex flex-col justify-end space-y-2">
										<Label>Distance</Label>
										<Select
											value={selectedDistance}
											onValueChange={handleDistanceChange}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select distance" />
											</SelectTrigger>
											<SelectContent>
												{Object.entries(DISTANCES).map(([key, value]) => (
													<SelectItem key={key} value={key}>
														{key.charAt(0).toUpperCase() + key.slice(1)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="flex flex-col justify-end space-y-2">
										<Label className="flex items-center">
											Target Time (hh:mm:ss)
										</Label>
										<TimeInputGroup
											form={form}
											onTimeChange={handleTimeInputChange}
										/>
										{(form.formState.errors.hours ||
											form.formState.errors.minutes ||
											form.formState.errors.seconds) && (
											<p className="text-sm text-red-500 mt-1 min-h-[1.25rem]">
												{form.formState.errors.hours?.message ||
													form.formState.errors.minutes?.message ||
													form.formState.errors.seconds?.message}
											</p>
										)}
									</div>
								</div>

								<div className="p-4 border rounded-lg space-y-2">
									<div className="flex justify-between">
										<span>Pace per {useMetric ? "Kilometer" : "Mile"}</span>
										<span className="font-mono">
											{(() => {
												const { hours, minutes, seconds, distance } =
													form.watch();
												const paceData = calculatePace(
													distance,
													hours,
													minutes,
													seconds,
												);
												return useMetric ? paceData.perKm : paceData.perMile;
											})()}
										</span>
									</div>
									<div className="flex justify-between">
										<span>Average Speed</span>
										<span className="font-mono">
											{(() => {
												const { hours, minutes, seconds, distance } =
													form.watch();
												const totalSeconds =
													hours * 3600 + minutes * 60 + seconds;
												// Use Number.isNaN for type safety
												if (
													Number.isNaN(totalSeconds) ||
													totalSeconds <= 0 ||
													!distance
												)
													return `0.0 ${useMetric ? "km/h" : "mph"}`;
												return `${(
													(distance / totalSeconds) *
													(useMetric ? 3.6 : 2.237)
												).toFixed(1)} ${useMetric ? "km/h" : "mph"}`;
											})()}
										</span>
									</div>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="pace-calculator" className="space-y-4">
							<div className="grid gap-4">
								<div className="space-y-2">
									<Label className="flex items-center">
										Target Pace per {useMetric ? "Kilometer" : "Mile"}
										<TimeInputTooltip />
									</Label>
									<Input
										type="text"
										placeholder="00:00"
										// register is still needed for RHF to track the field
										{...form.register("pace")}
										onChange={(e) => {
											const newValue = e.target.value;
											// Still update the hook for keyboard shortcuts if needed
											paceInput.setCurrentValue(newValue);
											// Update form state directly
											form.setValue("pace", newValue, { shouldValidate: true });

											// Update URL state only if different
											if (newValue !== pace) {
												setPace(newValue);
											}
										}}
										onKeyDown={paceInput.handleKeyDown}
										// Use the specific pace blur handler
										onBlur={handlePaceBlur}
										// Bind value to the form state directly
										value={form.watch("pace") || ""} // Use form state
										className={
											form.formState.errors.pace?.type === "manual" &&
											form.formState.errors.pace?.message?.includes(
												"unrealistically fast",
											)
												? "border-yellow-500"
												: form.formState.errors.pace
												  ? "border-red-500"
												  : ""
										}
									/>
									{form.formState.errors.pace && (
										<p className="text-sm text-red-500 mt-1 min-h-[1.25rem]">
											{form.formState.errors.pace.message}
										</p>
									)}
								</div>
								<div className="p-4 border rounded-lg space-y-2">
									{Object.entries(DISTANCES).map(([key, distance]) => {
										const currentPace = form.watch("pace");
										return (
											<div
												key={key}
												className="flex justify-between items-center"
											>
												<span>
													{key.charAt(0).toUpperCase() + key.slice(1)}
												</span>
												<span className="font-mono">
													{currentPace
														? calculateFinishTime(currentPace, distance)
														: "00:00:00"}
												</span>
											</div>
										);
									})}
								</div>
							</div>
						</TabsContent>

						<TabsContent value="track-splits" className="space-y-4">
							<div className="grid gap-4">
								<div className="space-y-2">
									<Label className="flex items-center">
										Target 400m Time (based on current pace)
									</Label>
									<div className="p-2 border rounded-md bg-muted text-muted-foreground font-mono">
										{(() => {
											const currentPace = form.watch("pace");
											if (!currentPace) return "00:00";
											const splits = calculateTrackSplits(currentPace || "");
											return splits["400m"];
										})()}
									</div>
								</div>

								<div className="space-y-2">
									<Label>Track Splits (based on current pace)</Label>
									<div className="p-4 border rounded-lg space-y-2">
										{(() => {
											const currentPace = form.watch("pace");
											const splits = calculateTrackSplits(currentPace || "");
											return Object.entries(splits).map(
												([distance, splitTime]) => (
													<div
														key={distance}
														className="flex justify-between items-center"
													>
														<span>{distance}</span>
														<span className="font-mono">{splitTime}</span>
													</div>
												),
											);
										})()}
									</div>
								</div>
							</div>
						</TabsContent>
					</Tabs>

					{mode === "advanced" &&
						form.watch("distance") &&
						(form.watch("hours") > 0 ||
							form.watch("minutes") > 0 ||
							form.watch("seconds") > 0) && (
							<>
								<div className="mt-6 space-y-4">
									<Label>Training Zones</Label>
									<TrainingZones
										recentRaceTime={getTimeString(
											form.watch("hours"),
											form.watch("minutes"),
											form.watch("seconds"),
										)}
										raceDistance={form.watch("distance")}
										useMetric={useMetric}
									/>
								</div>

								<div className="mt-6">
									<Label>Detailed Splits</Label>
									<SplitsTable
										distance={form.watch("distance")}
										targetTime={getTimeString(
											form.watch("hours"),
											form.watch("minutes"),
											form.watch("seconds"),
										)}
										useMetric={useMetric}
									/>
								</div>
							</>
						)}
				</form>
			</CardContent>
		</Card>
	);
}

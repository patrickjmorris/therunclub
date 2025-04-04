"use client";

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

// Zod schema for time input validation
const timeSchema = z
	.string()
	.min(1, "Time is required")
	.refine((val) => /^[0-9:]+$/.test(val), {
		message: "Only numbers and colons are allowed",
	})
	.refine((val) => /^\d{1,2}(:\d{2}){1,2}$/.test(val), {
		message: "Use format mm:ss or hh:mm:ss",
	})
	.refine(
		(val) => {
			const parts = val.split(":").map(Number);
			if (parts.length === 2) {
				return parts[1] < 60; // Validate seconds for mm:ss
			}
			return parts[1] < 60 && parts[2] < 60; // Validate minutes and seconds for hh:mm:ss
		},
		{
			message: "Invalid time: minutes and seconds must be less than 60",
		},
	);

// Form schema combining time and distance validation
const formSchema = z.object({
	time: timeSchema,
	distance: z.number().positive("Distance must be greater than 0"),
	pace: timeSchema.optional(),
});

type FormData = z.infer<typeof formSchema>;

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

	// Total time for race
	const [time, setTime] = useQueryState("time", {
		defaultValue: "",
		parse: (value) => value,
		serialize: (value) => value,
	});

	// Pace per mile/km
	const [pace, setPace] = useQueryState("pace", {
		defaultValue: "",
		parse: (value) => value,
		serialize: (value) => value,
	});

	// Initialize form with URL parameter values and persist between modes
	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			time: time || "",
			distance: DISTANCES[selectedDistance],
			pace: pace || "",
		},
	});

	// Calculate pace when race time changes
	const updatePaceFromRaceTime = (raceTime: string, distance: number) => {
		if (!raceTime || !distance) return;

		const totalSeconds = timeStringToSeconds(raceTime);
		const pacePerUnit = useMetric
			? totalSeconds / (distance / 1000) // seconds per km
			: totalSeconds / (distance / 1609.34); // seconds per mile

		const paceFormatted = formatTime(pacePerUnit);
		setPace(paceFormatted);
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

	// Handle time input in race time tab
	const handleRaceTimeInput = (value: string) => {
		setTime(value);
		if (value.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
			const distance = DISTANCES[selectedDistance];
			const calculatedPace = calculatePace(distance, value);
			const paceValue = useMetric
				? calculatedPace.perKm
				: calculatedPace.perMile;
			setPace(paceValue);
			form.setValue("pace", paceValue);
		}
	};

	// Calculate pace from distance and time
	const calculatePace = (distance: number, time: string) => {
		const [hours = 0, minutes = 0, seconds = 0] = time.split(":").map(Number);
		const totalSeconds = hours * 3600 + minutes * 60 + seconds;
		const pacePerKm = totalSeconds / (distance / 1000);
		const pacePerMile = totalSeconds / (distance / 1609.34);

		return {
			perKm: formatTime(pacePerKm),
			perMile: formatTime(pacePerMile),
		};
	};

	// Calculate finish time from pace and distance
	const calculateFinishTime = (pace: string, distance: number) => {
		const [minutes = 0, seconds = 0] = pace.split(":").map(Number);
		const paceInSeconds = minutes * 60 + seconds;
		const totalSeconds =
			(useMetric ? distance / 1000 : distance / 1609.34) * paceInSeconds;
		return formatTime(totalSeconds);
	};

	// Format seconds to mm:ss or hh:mm:ss
	const formatTime = (seconds: number) => {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = Math.floor(seconds % 60);
		return `${h > 0 ? `${h}:` : ""}${m.toString().padStart(2, "0")}:${s
			.toString()
			.padStart(2, "0")}`;
	};

	// Validate time input against world records
	const validateTimeInput = (time: string, distance: number) => {
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

		const timeInSeconds = timeStringToSeconds(time);
		const validation = validateTime(distanceKey, timeInSeconds);

		if (!validation.isValid) {
			form.setError("time", {
				type: "manual",
				message: validation.message,
			});
			return false;
		}

		if (validation.warning) {
			form.setError("time", {
				type: "manual",
				message: validation.warning,
			});
		} else {
			form.clearErrors("time");
		}

		return true;
	};

	// Calculate and sync pace across tabs when race time changes
	const syncPaceAcrossTabs = (raceTime: string, raceDistance: number) => {
		try {
			// Only calculate and update if we have valid inputs
			if (!raceTime || !raceDistance) return;

			// Calculate pace for the race
			const pace = calculatePace(raceDistance, raceTime);
			const paceValue = useMetric ? pace.perKm : pace.perMile;

			// Only update pace calculator tab
			if (activeTab === "pace-calculator") {
				setPace(paceValue);
				form.setValue("pace", paceValue);
			}

			// Only update track splits tab
			if (activeTab === "track-splits") {
				// Calculate 400m split based on race pace
				const paceInSeconds = timeStringToSeconds(paceValue);
				const distanceRatio = useMetric ? 0.4 : 0.4 * 1.60934; // Convert 400m to km or miles
				const splitTime = formatTime(paceInSeconds * distanceRatio);

				setTime(splitTime);
				form.setValue("time", splitTime);
			}
		} catch (error) {
			console.error("Error syncing pace:", error);
		}
	};

	// Handle time input changes and validation
	const handleTimeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		const fieldName = e.target.name as "time" | "pace";

		// Only allow numbers and colons
		if (!/^[0-9:]*$/.test(value)) {
			form.setError(fieldName, {
				type: "manual",
				message: "Only numbers and colons are allowed",
			});
			return;
		}

		// Clear any previous errors
		form.clearErrors(fieldName);

		// Update form value
		form.setValue(fieldName, value, {
			shouldValidate: true,
		});

		// Update URL state based on field
		if (fieldName === "time") {
			setTime(value);

			// Only sync pace when in race-time tab and we have a complete time entry
			if (activeTab === "race-time" && value.match(/^\d{1,2}(:\d{2}){1,2}$/)) {
				const distance = form.getValues("distance");
				if (distance) {
					syncPaceAcrossTabs(value, distance);
				}
			}
		} else if (fieldName === "pace") {
			setPace(value);
		}

		// Validate complete time entries
		if (value.match(/^\d{1,2}(:\d{2}){1,2}$/)) {
			if (fieldName === "time") {
				const distance = form.getValues("distance");
				if (distance) {
					validateTimeInput(value, distance);
				}
			} else if (fieldName === "pace") {
				validatePaceInput(value);
			}
		}
	};

	const validatePaceInput = (pace: string) => {
		const paceSeconds = timeStringToSeconds(pace);

		// Validate reasonable pace ranges (between 2:00/km and 15:00/km)
		const minPaceSeconds = 120; // 2:00 min/km
		const maxPaceSeconds = 900; // 15:00 min/km

		if (paceSeconds < minPaceSeconds) {
			form.setError("pace", {
				type: "manual",
				message: "Pace is unrealistically fast (faster than 2:00/km)",
			});
			return false;
		}

		if (paceSeconds > maxPaceSeconds) {
			form.setError("pace", {
				type: "manual",
				message: "Pace is unrealistically slow (slower than 15:00/km)",
			});
			return false;
		}

		return true;
	};

	const calculateSplitTime = (targetTime: string, splitDistance: number) => {
		// Convert target time to seconds
		const timeInSeconds = timeStringToSeconds(targetTime);

		// Calculate time for the split distance (400m is one lap)
		const splitTimeSeconds = (timeInSeconds / 400) * splitDistance;

		// Format the split time
		return formatTime(splitTimeSeconds);
	};

	const onSubmit = (data: FormData) => {
		try {
			if (data.time && data.distance) {
				// Validate time against world records
				if (!validateTimeInput(data.time, data.distance)) {
					return;
				}

				// Calculate pace
				const pace = calculatePace(data.distance, data.time);

				// If it's the advanced mode, ensure all calculations are updated
				if (mode === "advanced") {
					// Training zones and splits will automatically update through form.watch()

					// Reset track workout if needed
					if (form.watch("pace") !== pace[useMetric ? "perKm" : "perMile"]) {
						form.setValue("pace", pace[useMetric ? "perKm" : "perMile"]);
					}
				}
			}
		} catch (error) {
			console.error("Calculation error:", error);
			form.setError("time", {
				type: "manual",
				message: "Error calculating pace. Please check your inputs.",
			});
		}
	};

	// Sync form changes back to URL parameters
	const onFormChange = async (data: FormData) => {
		await setTime(data.time);
		await setPace(data.pace || "");
	};

	// Add new handler for blur events
	const handleTimeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		const value = e.target.value;
		const fieldName = e.target.name as "time" | "pace";

		// Skip validation if field is empty
		if (!value) return;

		// Validate time format
		if (!value.match(/^\d{1,2}(:\d{2}){1,2}$/)) {
			form.setError(fieldName, {
				type: "manual",
				message: "Invalid time format. Use mm:ss or hh:mm:ss",
			});
			return;
		}

		// Validate against world records for time field
		if (fieldName === "time") {
			const distance = form.getValues("distance");
			if (distance) {
				validateTimeInput(value, distance);
			}
		} else if (fieldName === "pace") {
			validatePaceInput(value);
		}
	};

	// Add time input handlers
	const timeInput = useTimeInput({
		setValue: form.setValue,
		fieldName: "time",
		initialValue: time || "00:00:00",
	});

	const paceInput = useTimeInput({
		setValue: form.setValue,
		fieldName: "pace",
		initialValue: pace || "00:00",
	});

	// Update the distance selection handler
	const handleDistanceChange = async (value: string) => {
		const newDistance = DISTANCES[value as keyof typeof DISTANCES];
		await setSelectedDistance(value as keyof typeof DISTANCES);
		form.setValue("distance", newDistance);

		// Recalculate pace if time exists
		const currentTime = form.getValues("time");
		if (currentTime) {
			syncPaceAcrossTabs(currentTime, newDistance);
		}
	};

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
					onChange={form.handleSubmit(onFormChange)}
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
											<TimeInputTooltip />
										</Label>
										<Input
											type="text"
											placeholder="00:00:00"
											{...form.register("time")}
											onChange={(e) => {
												handleTimeInput(e);
												timeInput.setCurrentValue(e.target.value);
											}}
											onKeyDown={timeInput.handleKeyDown}
											onBlur={handleTimeBlur}
											value={timeInput.currentValue}
											className={
												form.formState.errors.time?.type === "manual" &&
												form.formState.errors.time?.message?.includes(
													"extremely fast",
												)
													? "border-yellow-500"
													: form.formState.errors.time
													  ? "border-red-500"
													  : ""
											}
										/>
										{form.formState.errors.time && (
											<p
												className={`text-sm mt-1 ${
													form.formState.errors.time.message?.includes(
														"extremely fast",
													)
														? "text-yellow-500"
														: "text-red-500"
												}`}
											>
												{form.formState.errors.time.message}
											</p>
										)}
									</div>
								</div>

								<div className="p-4 border rounded-lg space-y-2">
									<div className="flex justify-between">
										<span>Pace per {useMetric ? "Kilometer" : "Mile"}</span>
										<span className="font-mono">
											{form.watch("time") && form.watch("distance")
												? calculatePace(
														form.watch("distance"),
														form.watch("time"),
												  )[useMetric ? "perKm" : "perMile"]
												: "00:00"}
										</span>
									</div>
									<div className="flex justify-between">
										<span>Average Speed</span>
										<span className="font-mono">
											{form.watch("time") && form.watch("distance")
												? `${(
														(form.watch("distance") /
															timeStringToSeconds(form.watch("time"))) *
														(useMetric ? 3.6 : 2.237)
												  ).toFixed(1)} ${useMetric ? "km/h" : "mph"}`
												: `0.0 ${useMetric ? "km/h" : "mph"}`}
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
										{...form.register("pace")}
										onChange={(e) => {
											handleTimeInput(e);
											paceInput.setCurrentValue(e.target.value);
										}}
										onKeyDown={paceInput.handleKeyDown}
										onBlur={handleTimeBlur}
										value={paceInput.currentValue}
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
										<p
											className={`text-sm mt-1 ${
												form.formState.errors.pace.message?.includes(
													"unrealistically fast",
												)
													? "text-yellow-500"
													: "text-red-500"
											}`}
										>
											{form.formState.errors.pace.message}
										</p>
									)}
								</div>
								<div className="p-4 border rounded-lg space-y-2">
									{Object.entries(DISTANCES).map(([key, distance]) => {
										const pace = form.watch("pace");
										return (
											<div
												key={key}
												className="flex justify-between items-center"
											>
												<span>
													{key.charAt(0).toUpperCase() + key.slice(1)}
												</span>
												<span className="font-mono">
													{pace
														? calculateFinishTime(pace, distance)
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
										<TimeInputTooltip />
									</Label>
									<Input
										type="text"
										placeholder="00:00"
										{...form.register("pace")}
										onChange={(e) => {
											handleTimeInput(e);
											paceInput.setCurrentValue(e.target.value);
										}}
										onKeyDown={paceInput.handleKeyDown}
										onBlur={handleTimeBlur}
										value={paceInput.currentValue}
										className={
											form.formState.errors.pace?.type === "manual" &&
											form.formState.errors.pace?.message?.includes(
												"extremely fast",
											)
												? "border-yellow-500"
												: form.formState.errors.pace
												  ? "border-red-500"
												  : ""
										}
									/>
									{form.formState.errors.pace && (
										<p
											className={`text-sm mt-1 ${
												form.formState.errors.pace.message?.includes(
													"extremely fast",
												)
													? "text-yellow-500"
													: "text-red-500"
											}`}
										>
											{form.formState.errors.pace.message}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label>Track Splits (based on target 400m time)</Label>
									<div className="p-4 border rounded-lg space-y-2">
										{Object.entries(calculateTrackSplits(pace)).map(
											([distance, splitTime]) => (
												<div
													key={distance}
													className="flex justify-between items-center"
												>
													<span>{distance}</span>
													<span className="font-mono">{splitTime}</span>
												</div>
											),
										)}
									</div>
								</div>
							</div>
						</TabsContent>
					</Tabs>

					{mode === "advanced" &&
						form.watch("time") &&
						form.watch("distance") && (
							<>
								<div className="mt-6 space-y-4">
									<Label>Training Zones</Label>
									<TrainingZones
										recentRaceTime={form.watch("time")}
										raceDistance={form.watch("distance")}
										useMetric={useMetric}
									/>
								</div>

								<div className="mt-6">
									<Label>Detailed Splits</Label>
									<SplitsTable
										distance={form.watch("distance")}
										targetTime={form.watch("time")}
										useMetric={useMetric}
									/>
								</div>

								{/* <div className="mt-6">
									<Label>Track Workout</Label>
									<TrackWorkout
										targetPace={
											calculatePace(form.watch("distance"), form.watch("time"))[
												useMetric ? "perKm" : "perMile"
											]
										}
										intervalDistance={400}
									/>
								</div> */}
							</>
						)}
				</form>
			</CardContent>
		</Card>
	);
}

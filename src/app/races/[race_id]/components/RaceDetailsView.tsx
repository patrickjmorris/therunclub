"use client";

import { useState, useEffect } from "react";
import {
	Calendar,
	Clock,
	MapPin,
	Award,
	Users,
	Heart,
	ChevronRight,
	Activity as RunningIcon,
} from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RunSignupRace, EventDetails } from "@/types/runsignup";
import {
	formatDate,
	formatTime,
	getFormattedAddress,
	getCurrentRegistrationPeriod,
	calculateTimeLeft,
	getMainEvent,
	extractShortDescription,
	getGiveawayInfo,
} from "@/lib/utils/event-helpers";

interface RaceDetailsViewProps {
	raceData: RunSignupRace;
}

export default function RaceDetailsView({ raceData }: RaceDetailsViewProps) {
	const mainEvent = getMainEvent(raceData);
	const [timeLeft, setTimeLeft] = useState(
		calculateTimeLeft(mainEvent?.start_time),
	);

	useEffect(() => {
		if (!mainEvent?.start_time) return;

		const timer = setInterval(() => {
			setTimeLeft(calculateTimeLeft(mainEvent.start_time));
		}, 1000);

		return () => clearInterval(timer);
	}, [mainEvent?.start_time]);

	const currentRegistration = mainEvent
		? getCurrentRegistrationPeriod(mainEvent.registration_periods)
		: null;

	const formattedAddress = getFormattedAddress(
		raceData.address?.street,
		raceData.address?.street2,
		raceData.address?.city,
		raceData.address?.state,
	);

	const defaultTabValue =
		raceData.events?.[0]?.event_id.toString() || "no-events";

	return (
		<div className="max-w-4xl mx-auto p-4">
			<Card className="overflow-hidden border-0 shadow-lg">
				<div className="bg-gradient-to-r from-rose-500 via-orange-400 to-amber-300 h-3" />
				<CardHeader className="relative pb-0">
					<div className="flex justify-between items-start">
						<div>
							<div className="flex items-center gap-2 mb-2">
								{raceData.is_registration_open === "T" ? (
									<Badge
										variant="outline"
										className="text-amber-600 border-amber-300"
									>
										Registration Open
									</Badge>
								) : (
									<Badge variant="secondary">Registration Closed</Badge>
								)}
							</div>
							<CardTitle className="text-3xl font-bold text-slate-800">
								{raceData.name || "Race Name Not Available"}
							</CardTitle>
						</div>
						<div className="hidden md:flex items-center justify-center bg-amber-50 rounded-full p-3 border-2 border-amber-200">
							<RunningIcon className="h-10 w-10 text-amber-500" />
						</div>
					</div>
					<div className="flex flex-col sm:flex-row flex-wrap gap-x-4 gap-y-2 mt-6 text-slate-700">
						<div className="flex items-center gap-2">
							<Calendar className="h-5 w-5 text-rose-500" />
							<span className="font-medium">
								{formatDate(raceData.next_date)}
							</span>
						</div>
						{mainEvent?.start_time && (
							<div className="flex items-center gap-2">
								<Clock className="h-5 w-5 text-rose-500" />
								<span className="font-medium">
									{formatTime(mainEvent.start_time)}
								</span>
							</div>
						)}
						<div className="flex items-center gap-2">
							<MapPin className="h-5 w-5 text-rose-500" />
							<span className="font-medium">{formattedAddress}</span>
						</div>
					</div>
				</CardHeader>
				<CardContent className="pt-6">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<div className="lg:col-span-2">
							{raceData.events && raceData.events.length > 0 ? (
								<Tabs defaultValue={defaultTabValue} className="w-full">
									<TabsList
										className="grid w-full grid-cols-dynamic mb-4"
										style={{
											gridTemplateColumns: `repeat(${raceData.events.length}, minmax(0, 1fr))`,
										}}
									>
										{raceData.events.map((event) => (
											<TabsTrigger
												key={event.event_id}
												value={event.event_id.toString()}
											>
												{event.name.includes("Virtual")
													? "Virtual"
													: event.name.includes("Kids")
													  ? "Kids Fun Run"
													  : event.distance || event.name}
											</TabsTrigger>
										))}
									</TabsList>
									{raceData.events.map((event) => (
										<TabsContent
											key={event.event_id}
											value={event.event_id.toString()}
											className="space-y-4"
										>
											<div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
												<h3 className="font-bold text-lg text-slate-800 mb-2">
													{event.name}
												</h3>
												<p className="text-slate-600 mb-3 text-sm">
													{extractShortDescription(
														event.details || raceData.description,
													)}
												</p>
												<div className="flex flex-wrap gap-3 mt-4">
													{event.start_time && (
														<div className="bg-white rounded-md px-3 py-2 border border-slate-200 flex items-center gap-2">
															<Clock className="h-4 w-4 text-amber-500" />
															<span className="text-sm">
																{formatTime(event.start_time)}
															</span>
														</div>
													)}
													<div className="bg-white rounded-md px-3 py-2 border border-slate-200 flex items-center gap-2">
														<Award className="h-4 w-4 text-amber-500" />
														<span className="text-sm">
															{event.distance || "Distance TBD"}
														</span>
													</div>
													{event.participant_cap > 0 && (
														<div className="bg-white rounded-md px-3 py-2 border border-slate-200 flex items-center gap-2">
															<Users className="h-4 w-4 text-amber-500" />
															<span className="text-sm">
																Cap: {event.participant_cap}
															</span>
														</div>
													)}
												</div>
											</div>
										</TabsContent>
									))}
								</Tabs>
							) : (
								<p className="text-slate-500">Event details not available.</p>
							)}
							<div className="mt-4 bg-teal-50 rounded-lg p-4 border border-slate-200">
								<h3 className="font-bold text-slate-800 mb-3">Description</h3>
								<p
									className="text-slate-600 mb-3 text-sm prose lg:prose-xl"
									// biome-ignore lint/security/noDangerouslySetInnerHtml: Save from this source
									dangerouslySetInnerHTML={{ __html: raceData.description }}
								/>
							</div>
						</div>
						<div className="lg:col-span-1 space-y-4">
							{mainEvent?.start_time &&
								(timeLeft.days > 0 ||
									timeLeft.hours > 0 ||
									timeLeft.minutes > 0 ||
									timeLeft.seconds > 0) && (
									<div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
										<h3 className="font-bold text-slate-800 mb-3">
											Race Day Countdown
										</h3>
										<div className="grid grid-cols-4 gap-2 mb-2">
											{[
												{ label: "Days", value: timeLeft.days },
												{ label: "Hours", value: timeLeft.hours },
												{ label: "Mins", value: timeLeft.minutes },
												{ label: "Secs", value: timeLeft.seconds },
											].map(({ label, value }) => (
												<div
													key={label}
													className="bg-white rounded-lg p-2 text-center border border-slate-200"
												>
													<div className="text-2xl font-bold text-rose-500">
														{value}
													</div>
													<div className="text-xs text-slate-500">{label}</div>
												</div>
											))}
										</div>
									</div>
								)}
							<div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3">
								{currentRegistration ? (
									<div className="flex justify-between items-center">
										<span className="text-sm text-slate-600">
											Current Price:
										</span>
										<span className="font-bold text-lg text-slate-800">
											{currentRegistration.fee}
										</span>
									</div>
								) : (
									<div className="text-sm text-slate-600">
										Pricing info not available.
									</div>
								)}
								{currentRegistration ? (
									<div className="flex justify-between items-center">
										<span className="text-sm text-slate-600">
											Registration Period:
										</span>
										<Badge variant="outline" className="font-medium">
											{currentRegistration.periodName}
										</Badge>
									</div>
								) : (
									<div className="text-sm text-slate-600">
										Registration period not available.
									</div>
								)}
								{getGiveawayInfo(mainEvent) ? (
									<div className="flex justify-between items-center">
										<span className="text-sm text-slate-600">Giveaway:</span>
										<span className="text-sm text-slate-800 text-right">
											{getGiveawayInfo(mainEvent)}
										</span>
									</div>
								) : (
									<div className="flex justify-between items-center">
										<span className="text-sm text-slate-600">Giveaway:</span>
										<span className="text-sm text-slate-500">No Data</span>
									</div>
								)}
								{raceData.is_registration_open === "T" && raceData.url ? (
									<Button
										asChild
										className="w-full bg-rose-500 hover:bg-rose-600 text-white mt-2"
									>
										<a
											href={raceData.url}
											target="_blank"
											rel="noopener noreferrer"
										>
											Register Now
										</a>
									</Button>
								) : (
									<Button className="w-full mt-2" disabled>
										Registration Closed
									</Button>
								)}
								{raceData.external_race_url && (
									<div className="mt-3 text-center">
										<a
											href={raceData.external_race_url}
											target="_blank"
											rel="noopener noreferrer"
											className="text-sm text-rose-500 hover:text-rose-600 flex items-center justify-center"
										>
											View full race details{" "}
											<ChevronRight className="h-4 w-4 ml-1" />
										</a>
									</div>
								)}
							</div>
						</div>
					</div>
				</CardContent>
				<CardFooter className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 border-t border-slate-100 py-4 px-6 gap-4">
					<div className="flex-grow" />
					<div className="flex gap-2">
						<Button variant="outline" size="sm" className="text-slate-600">
							Share Event
						</Button>
						<Button variant="outline" size="sm" className="text-slate-600">
							Add to Calendar
						</Button>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}

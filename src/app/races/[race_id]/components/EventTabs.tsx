"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Award, Users } from "lucide-react";
import { formatTime, extractShortDescription } from "@/lib/utils/event-helpers";
import type { EventDetails } from "@/types/runsignup"; // Assuming RunSignupRace is in the parent

interface EventTabsProps {
	events: EventDetails[];
	defaultTabValue: string;
	raceDescription?: string; // Pass full description for fallback
}

export function EventTabs({
	events,
	defaultTabValue,
	raceDescription,
}: EventTabsProps) {
	if (!events || events.length === 0) {
		return <p className="text-slate-500">Event details not available.</p>;
	}

	return (
		<Tabs defaultValue={defaultTabValue} className="w-full">
			<TabsList className="mb-4 overflow-x-auto whitespace-nowrap py-1">
				{events.map((event) => (
					<TabsTrigger
						key={event.event_id}
						value={event.event_id.toString()}
						className="inline-block"
					>
						{event.name.includes("Virtual")
							? "Virtual"
							: event.name.includes("Kids")
							  ? "Kids Fun Run"
							  : event.distance || event.name}
					</TabsTrigger>
				))}
			</TabsList>
			{events.map((event) => (
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
								event.details || raceDescription, // Use passed description
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
									<span className="text-sm">Cap: {event.participant_cap}</span>
								</div>
							)}
						</div>
					</div>
				</TabsContent>
			))}
		</Tabs>
	);
}

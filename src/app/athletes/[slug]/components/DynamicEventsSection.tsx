"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface Event {
	id: string;
	name: string;
	date: string;
	location: string | null;
	discipline: string | null;
	result: {
		place: string | null;
		time: string | null;
		notes: string | null;
	} | null;
	status: "upcoming" | "completed" | "cancelled";
}

interface DynamicEventsSectionProps {
	athleteSlug: string;
	events: Event[];
	isAdmin: boolean;
}

// Loading state component
function EventsSectionSkeleton() {
	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-semibold dark:text-gray-100">Events</h2>
				<Skeleton className="h-8 w-24" />
			</div>
			<div className="space-y-4">
				{[1, 2].map((i) => (
					<div
						key={i}
						className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
					>
						<div className="flex justify-between items-start">
							<div className="space-y-2">
								<Skeleton className="h-6 w-48" />
								<Skeleton className="h-4 w-32" />
							</div>
							<div className="text-right space-y-2">
								<Skeleton className="h-6 w-24" />
								<Skeleton className="h-4 w-32" />
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

export function DynamicEventsSection({
	athleteSlug,
	events,
	isAdmin,
}: DynamicEventsSectionProps) {
	const [isAdding, setIsAdding] = useState(false);

	// Filter events by status
	const upcomingEvents = events.filter((event) => event.status === "upcoming");
	const completedEvents = events.filter(
		(event) => event.status === "completed",
	);
	const cancelledEvents = events.filter(
		(event) => event.status === "cancelled",
	);

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-semibold dark:text-gray-100">Events</h2>
				{isAdmin && (
					<button
						type="button"
						onClick={() => setIsAdding(true)}
						className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
					>
						Add Event
					</button>
				)}
			</div>

			{/* Upcoming Events */}
			{upcomingEvents.length > 0 && (
				<div className="space-y-4">
					<h3 className="text-lg font-medium dark:text-gray-100">
						Upcoming Events
					</h3>
					<div className="space-y-4">
						{upcomingEvents.map((event) => (
							<div
								key={event.id}
								className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg"
							>
								<div className="flex justify-between items-start">
									<div className="space-y-1">
										<h4 className="font-medium dark:text-gray-200">
											{event.name}
										</h4>
										<p className="text-sm text-gray-600 dark:text-gray-400">
											{format(new Date(event.date), "MMMM d, yyyy")}
										</p>
										{event.location && (
											<p className="text-sm text-gray-500 dark:text-gray-400">
												{event.location}
											</p>
										)}
										{event.discipline && (
											<p className="text-sm text-gray-500 dark:text-gray-400">
												{event.discipline}
											</p>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Completed Events */}
			{completedEvents.length > 0 && (
				<div className="space-y-4">
					<h3 className="text-lg font-medium dark:text-gray-100">
						Past Events
					</h3>
					<div className="space-y-4">
						{completedEvents.map((event) => (
							<div
								key={event.id}
								className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
							>
								<div className="flex justify-between items-start">
									<div className="space-y-1">
										<h4 className="font-medium dark:text-gray-200">
											{event.name}
										</h4>
										<p className="text-sm text-gray-600 dark:text-gray-400">
											{format(new Date(event.date), "MMMM d, yyyy")}
										</p>
										{event.location && (
											<p className="text-sm text-gray-500 dark:text-gray-400">
												{event.location}
											</p>
										)}
										{event.discipline && (
											<p className="text-sm text-gray-500 dark:text-gray-400">
												{event.discipline}
											</p>
										)}
										{event.result && (
											<div className="mt-2 space-y-1">
												{event.result.place && (
													<p className="text-sm font-medium text-gray-700 dark:text-gray-300">
														Place: {event.result.place}
													</p>
												)}
												{event.result.time && (
													<p className="text-sm font-medium text-gray-700 dark:text-gray-300">
														Time: {event.result.time}
													</p>
												)}
												{event.result.notes && (
													<p className="text-sm text-gray-500 dark:text-gray-400">
														{event.result.notes}
													</p>
												)}
											</div>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Cancelled Events */}
			{cancelledEvents.length > 0 && (
				<div className="space-y-4">
					<h3 className="text-lg font-medium dark:text-gray-100">
						Cancelled Events
					</h3>
					<div className="space-y-4">
						{cancelledEvents.map((event) => (
							<div
								key={event.id}
								className="p-4 border border-red-200 dark:border-red-800 rounded-lg"
							>
								<div className="flex justify-between items-start">
									<div className="space-y-1">
										<h4 className="font-medium dark:text-gray-200">
											{event.name}
										</h4>
										<p className="text-sm text-gray-600 dark:text-gray-400">
											{format(new Date(event.date), "MMMM d, yyyy")}
										</p>
										{event.location && (
											<p className="text-sm text-gray-500 dark:text-gray-400">
												{event.location}
											</p>
										)}
										{event.discipline && (
											<p className="text-sm text-gray-500 dark:text-gray-400">
												{event.discipline}
											</p>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{events.length === 0 && (
				<p className="text-gray-500 dark:text-gray-400">
					No events listed yet.
				</p>
			)}
		</div>
	);
}

// Export the loading state component
export { EventsSectionSkeleton };

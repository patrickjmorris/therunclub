import { format } from "date-fns";

type EventStatus = "upcoming" | "completed" | "cancelled";

interface Event {
	id: string;
	name: string;
	date: string;
	location?: string | null;
	discipline?: string | null;
	description?: string | null;
	website?: string | null;
	status: EventStatus;
	result?: {
		place?: number;
		time?: string;
		notes?: string;
	} | null;
}

interface EventsSectionProps {
	events: Event[];
}

export function EventsSection({ events }: EventsSectionProps) {
	const upcomingEvents = events
		.filter((e) => e.status === "upcoming")
		.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

	const completedEvents = events
		.filter((e) => e.status === "completed")
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	const cancelledEvents = events
		.filter((e) => e.status === "cancelled")
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	return (
		<div className="space-y-4">
			<h2 className="text-2xl font-semibold dark:text-gray-100">
				Upcoming Events
			</h2>

			<div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm space-y-6">
				{upcomingEvents.length > 0 && (
					<div className="space-y-4">
						<h3 className="text-lg font-medium dark:text-gray-100">
							Upcoming Events
						</h3>
						<div className="space-y-4">
							{upcomingEvents.map((event) => (
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
											{event.description && (
												<p className="text-sm text-gray-500 dark:text-gray-400">
													{event.description}
												</p>
											)}
											{event.website && (
												<a
													href={event.website}
													target="_blank"
													rel="noopener noreferrer"
													className="text-sm text-blue-600 hover:underline dark:text-blue-400"
												>
													Event Website
												</a>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

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
											{event.website && (
												<a
													href={event.website}
													target="_blank"
													rel="noopener noreferrer"
													className="text-sm text-blue-600 hover:underline dark:text-blue-400"
												>
													Event Website
												</a>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{cancelledEvents.length > 0 && (
					<div className="space-y-4">
						<h3 className="text-lg font-medium dark:text-gray-100">
							Cancelled Events
						</h3>
						<div className="space-y-4">
							{cancelledEvents.map((event) => (
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
											{event.description && (
												<p className="text-sm text-gray-500 dark:text-gray-400">
													{event.description}
												</p>
											)}
											{event.website && (
												<a
													href={event.website}
													target="_blank"
													rel="noopener noreferrer"
													className="text-sm text-blue-600 hover:underline dark:text-blue-400"
												>
													Event Website
												</a>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

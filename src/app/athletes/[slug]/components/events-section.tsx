"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { addEvent, updateEvent, deleteEvent } from "../actions";
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
	athleteId: string;
	events: Event[];
	isAdmin: boolean;
}

export function EventsSection({
	athleteId,
	events,
	isAdmin,
}: EventsSectionProps) {
	const [isAdding, setIsAdding] = useState(false);
	const [editingEventId, setEditingEventId] = useState<string | null>(null);
	const [selectedStatus, setSelectedStatus] = useState<EventStatus>("upcoming");

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const data = {
			name: formData.get("name") as string,
			date: formData.get("date") as string,
			location: formData.get("location") as string,
			discipline: formData.get("discipline") as string,
			description: formData.get("description") as string,
			website: formData.get("website") as string,
			status: selectedStatus,
			result:
				selectedStatus === "completed"
					? {
							place: formData.get("place")
								? parseInt(formData.get("place") as string)
								: undefined,
							time: formData.get("time") as string,
							notes: formData.get("notes") as string,
					  }
					: undefined,
		};

		if (editingEventId) {
			await updateEvent(editingEventId, athleteId, data);
			setEditingEventId(null);
		} else {
			await addEvent(athleteId, data);
			setIsAdding(false);
		}
	};

	const handleDelete = async (eventId: string) => {
		if (confirm("Are you sure you want to delete this event?")) {
			await deleteEvent(eventId, athleteId);
		}
	};

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

			{(isAdding || editingEventId) && isAdmin && (
				<Card className="p-4">
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid gap-4">
							<div>
								<Label htmlFor="name">Event Name</Label>
								<Input
									id="name"
									name="name"
									required
									defaultValue={
										editingEventId
											? events.find((e) => e.id === editingEventId)?.name
											: ""
									}
								/>
							</div>
							<div>
								<Label htmlFor="date">Date</Label>
								<Input
									id="date"
									name="date"
									type="date"
									required
									defaultValue={
										editingEventId
											? events.find((e) => e.id === editingEventId)?.date
											: ""
									}
								/>
							</div>
							<div>
								<Label htmlFor="location">Location</Label>
								<Input
									id="location"
									name="location"
									defaultValue={
										editingEventId
											? events.find((e) => e.id === editingEventId)?.location ||
											  ""
											: ""
									}
								/>
							</div>
							<div>
								<Label htmlFor="discipline">Discipline</Label>
								<Input
									id="discipline"
									name="discipline"
									defaultValue={
										editingEventId
											? events.find((e) => e.id === editingEventId)
													?.discipline || ""
											: ""
									}
								/>
							</div>
							<div>
								<Label htmlFor="description">Description</Label>
								<Textarea
									id="description"
									name="description"
									defaultValue={
										editingEventId
											? events.find((e) => e.id === editingEventId)
													?.description || ""
											: ""
									}
								/>
							</div>
							<div>
								<Label htmlFor="website">Website</Label>
								<Input
									id="website"
									name="website"
									type="url"
									defaultValue={
										editingEventId
											? events.find((e) => e.id === editingEventId)?.website ||
											  ""
											: ""
									}
								/>
							</div>
							<div>
								<Label htmlFor="status">Status</Label>
								<Select
									value={selectedStatus}
									onValueChange={(value: EventStatus) =>
										setSelectedStatus(value)
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="upcoming">Upcoming</SelectItem>
										<SelectItem value="completed">Completed</SelectItem>
										<SelectItem value="cancelled">Cancelled</SelectItem>
									</SelectContent>
								</Select>
							</div>
							{selectedStatus === "completed" && (
								<>
									<div>
										<Label htmlFor="place">Place</Label>
										<Input
											id="place"
											name="place"
											type="number"
											defaultValue={
												editingEventId
													? events.find((e) => e.id === editingEventId)?.result
															?.place
													: ""
											}
										/>
									</div>
									<div>
										<Label htmlFor="time">Time</Label>
										<Input
											id="time"
											name="time"
											defaultValue={
												editingEventId
													? events.find((e) => e.id === editingEventId)?.result
															?.time
													: ""
											}
										/>
									</div>
									<div>
										<Label htmlFor="notes">Notes</Label>
										<Textarea
											id="notes"
											name="notes"
											defaultValue={
												editingEventId
													? events.find((e) => e.id === editingEventId)?.result
															?.notes
													: ""
											}
										/>
									</div>
								</>
							)}
						</div>
						<div className="flex justify-end space-x-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setIsAdding(false);
									setEditingEventId(null);
								}}
							>
								Cancel
							</Button>
							<Button type="submit">
								{editingEventId ? "Update" : "Add"} Event
							</Button>
						</div>
					</form>
				</Card>
			)}

			<div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow space-y-6">
				<div className="flex justify-between items-center">
					{!isAdding && !editingEventId && isAdmin && (
						<Button onClick={() => setIsAdding(true)}>Add Event</Button>
					)}
				</div>

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
										{isAdmin && (
											<div className="flex space-x-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => setEditingEventId(event.id)}
												>
													Edit
												</Button>
												<Button
													variant="destructive"
													size="sm"
													onClick={() => handleDelete(event.id)}
												>
													Delete
												</Button>
											</div>
										)}
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
										{isAdmin && (
											<div className="flex space-x-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => setEditingEventId(event.id)}
												>
													Edit
												</Button>
												<Button
													variant="destructive"
													size="sm"
													onClick={() => handleDelete(event.id)}
												>
													Delete
												</Button>
											</div>
										)}
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
										{isAdmin && (
											<div className="flex space-x-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => setEditingEventId(event.id)}
												>
													Edit
												</Button>
												<Button
													variant="destructive"
													size="sm"
													onClick={() => handleDelete(event.id)}
												>
													Delete
												</Button>
											</div>
										)}
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

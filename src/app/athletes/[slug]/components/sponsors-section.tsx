"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { addSponsor, updateSponsor, deleteSponsor } from "../actions";
import { format } from "date-fns";

interface Sponsor {
	id: string;
	name: string;
	website?: string | null;
	logo?: string | null;
	startDate?: string | null;
	endDate?: string | null;
	isPrimary?: boolean | null;
}

interface SponsorsSectionProps {
	athleteSlug: string;
	sponsors: Sponsor[];
	isAdmin: boolean;
}

export function SponsorsSection({
	athleteSlug,
	sponsors,
	isAdmin,
}: SponsorsSectionProps) {
	const [isAdding, setIsAdding] = useState(false);
	const [editingSponsorId, setEditingSponsorId] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const data = {
			name: formData.get("name") as string,
			website: formData.get("website") as string,
			logo: formData.get("logo") as string,
			startDate: formData.get("startDate") as string,
			endDate: formData.get("endDate") as string,
			isPrimary: formData.get("isPrimary") === "on",
		};

		if (editingSponsorId) {
			await updateSponsor(editingSponsorId, athleteSlug, data);
			setEditingSponsorId(null);
		} else {
			await addSponsor(athleteSlug, data);
			setIsAdding(false);
		}
	};

	const handleDelete = async (sponsorId: string) => {
		if (confirm("Are you sure you want to delete this sponsor?")) {
			await deleteSponsor(sponsorId, athleteSlug);
		}
	};

	return (
		<div className="space-y-4">
			<h2 className="text-2xl font-semibold dark:text-gray-100">Sponsors</h2>

			{(isAdding || editingSponsorId) && isAdmin && (
				<Card className="p-4">
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid gap-4">
							<div>
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									name="name"
									required
									defaultValue={
										editingSponsorId
											? sponsors.find((s) => s.id === editingSponsorId)?.name
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
										editingSponsorId
											? sponsors.find((s) => s.id === editingSponsorId)
													?.website || ""
											: ""
									}
								/>
							</div>
							<div>
								<Label htmlFor="logo">Logo URL</Label>
								<Input
									id="logo"
									name="logo"
									type="url"
									defaultValue={
										editingSponsorId
											? sponsors.find((s) => s.id === editingSponsorId)?.logo ||
											  ""
											: ""
									}
								/>
							</div>
							<div>
								<Label htmlFor="startDate">Start Date</Label>
								<Input
									id="startDate"
									name="startDate"
									type="date"
									defaultValue={
										editingSponsorId
											? sponsors.find((s) => s.id === editingSponsorId)
													?.startDate || ""
											: ""
									}
								/>
							</div>
							<div>
								<Label htmlFor="endDate">End Date</Label>
								<Input
									id="endDate"
									name="endDate"
									type="date"
									defaultValue={
										editingSponsorId
											? sponsors.find((s) => s.id === editingSponsorId)
													?.endDate || ""
											: ""
									}
								/>
							</div>
							<div className="flex items-center space-x-2">
								<Switch
									id="isPrimary"
									name="isPrimary"
									defaultChecked={
										editingSponsorId
											? sponsors.find((s) => s.id === editingSponsorId)
													?.isPrimary || false
											: false
									}
								/>
								<Label htmlFor="isPrimary">Primary Sponsor</Label>
							</div>
						</div>
						<div className="flex justify-end space-x-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setIsAdding(false);
									setEditingSponsorId(null);
								}}
							>
								Cancel
							</Button>
							<Button type="submit">
								{editingSponsorId ? "Update" : "Add"} Sponsor
							</Button>
						</div>
					</form>
				</Card>
			)}

			<div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
				<div className="flex justify-between items-center">
					{!isAdding && !editingSponsorId && isAdmin && (
						<Button onClick={() => setIsAdding(true)}>Add Sponsor</Button>
					)}
				</div>
				{sponsors.length > 0 && (
					<div className="space-y-4">
						{sponsors.map((sponsor) => (
							<div
								key={sponsor.id}
								className="border-b last:border-0 border-gray-200 dark:border-gray-700 pb-4 last:pb-0"
							>
								<div className="flex justify-between items-start">
									<div className="space-y-1">
										<div className="flex items-center gap-2">
											<h3 className="font-medium dark:text-gray-200">
												{sponsor.name}
											</h3>
											{sponsor.isPrimary && (
												<span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
													Primary
												</span>
											)}
										</div>
										{sponsor.website && (
											<a
												href={sponsor.website}
												target="_blank"
												rel="noopener noreferrer"
												className="text-sm text-blue-600 hover:underline dark:text-blue-400"
											>
												{sponsor.website}
											</a>
										)}
										{(sponsor.startDate || sponsor.endDate) && (
											<p className="text-sm text-gray-500 dark:text-gray-400">
												{sponsor.startDate &&
													`From ${format(
														new Date(sponsor.startDate),
														"MMM d, yyyy",
													)}`}
												{sponsor.startDate && sponsor.endDate && " to "}
												{sponsor.endDate &&
													format(new Date(sponsor.endDate), "MMM d, yyyy")}
											</p>
										)}
									</div>
									{isAdmin && (
										<div className="flex space-x-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => setEditingSponsorId(sponsor.id)}
											>
												Edit
											</Button>
											<Button
												variant="destructive"
												size="sm"
												onClick={() => handleDelete(sponsor.id)}
											>
												Delete
											</Button>
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

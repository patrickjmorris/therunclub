"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { addGear, updateGear, deleteGear } from "../actions";

type GearCategory =
	| "racing_shoes"
	| "training_shoes"
	| "shirts"
	| "shorts"
	| "tights"
	| "recovery"
	| "other";

interface Gear {
	id: string;
	name: string;
	brand: string;
	category: GearCategory;
	model?: string | null;
	description?: string | null;
	purchaseUrl?: string | null;
	imageUrl?: string | null;
	isCurrent?: boolean | null;
}

interface GearSectionProps {
	athleteId: string;
	gear: Gear[];
	isAdmin: boolean;
}

const CATEGORIES = [
	{ value: "racing_shoes", label: "Racing Shoes" },
	{ value: "training_shoes", label: "Training Shoes" },
	{ value: "shirts", label: "Shirts" },
	{ value: "shorts", label: "Shorts" },
	{ value: "tights", label: "Tights" },
	{ value: "recovery", label: "Recovery" },
	{ value: "other", label: "Other" },
];

export function GearSection({ athleteId, gear, isAdmin }: GearSectionProps) {
	const [isAdding, setIsAdding] = useState(false);
	const [editingGearId, setEditingGearId] = useState<string | null>(null);
	const [selectedCategory, setSelectedCategory] =
		useState<GearCategory>("racing_shoes");

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const data = {
			name: formData.get("name") as string,
			brand: formData.get("brand") as string,
			category: selectedCategory,
			model: formData.get("model") as string,
			description: formData.get("description") as string,
			purchaseUrl: formData.get("purchaseUrl") as string,
			imageUrl: formData.get("imageUrl") as string,
			isCurrent: formData.get("isCurrent") === "on",
		};

		if (editingGearId) {
			await updateGear(editingGearId, athleteId, data);
			setEditingGearId(null);
		} else {
			await addGear(athleteId, data);
			setIsAdding(false);
		}
	};

	const handleDelete = async (gearId: string) => {
		if (confirm("Are you sure you want to delete this gear?")) {
			await deleteGear(gearId, athleteId);
		}
	};

	const currentGear = gear.filter((g) => g.isCurrent);
	const retiredGear = gear.filter((g) => !g.isCurrent);

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-xl font-semibold">Gear</h2>
				{!isAdding && !editingGearId && isAdmin && (
					<Button onClick={() => setIsAdding(true)}>Add Gear</Button>
				)}
			</div>

			{(isAdding || editingGearId) && isAdmin && (
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
										editingGearId
											? gear.find((g) => g.id === editingGearId)?.name
											: ""
									}
								/>
							</div>
							<div>
								<Label htmlFor="brand">Brand</Label>
								<Input
									id="brand"
									name="brand"
									required
									defaultValue={
										editingGearId
											? gear.find((g) => g.id === editingGearId)?.brand
											: ""
									}
								/>
							</div>
							<div>
								<Label htmlFor="category">Category</Label>
								<Select
									value={selectedCategory}
									onValueChange={(value: GearCategory) =>
										setSelectedCategory(value)
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{CATEGORIES.map((category) => (
											<SelectItem key={category.value} value={category.value}>
												{category.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label htmlFor="model">Model</Label>
								<Input
									id="model"
									name="model"
									defaultValue={
										editingGearId
											? gear.find((g) => g.id === editingGearId)?.model || ""
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
										editingGearId
											? gear.find((g) => g.id === editingGearId)?.description ||
											  ""
											: ""
									}
								/>
							</div>
							<div>
								<Label htmlFor="purchaseUrl">Purchase URL</Label>
								<Input
									id="purchaseUrl"
									name="purchaseUrl"
									type="url"
									defaultValue={
										editingGearId
											? gear.find((g) => g.id === editingGearId)?.purchaseUrl ||
											  ""
											: ""
									}
								/>
							</div>
							<div>
								<Label htmlFor="imageUrl">Image URL</Label>
								<Input
									id="imageUrl"
									name="imageUrl"
									type="url"
									defaultValue={
										editingGearId
											? gear.find((g) => g.id === editingGearId)?.imageUrl || ""
											: ""
									}
								/>
							</div>
							<div className="flex items-center space-x-2">
								<Switch
									id="isCurrent"
									name="isCurrent"
									defaultChecked={
										editingGearId
											? gear.find((g) => g.id === editingGearId)?.isCurrent ||
											  false
											: true
									}
								/>
								<Label htmlFor="isCurrent">Currently Using</Label>
							</div>
						</div>
						<div className="flex justify-end space-x-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setIsAdding(false);
									setEditingGearId(null);
								}}
							>
								Cancel
							</Button>
							<Button type="submit">
								{editingGearId ? "Update" : "Add"} Gear
							</Button>
						</div>
					</form>
				</Card>
			)}

			<div className="space-y-6">
				{currentGear.length > 0 && (
					<div className="space-y-4">
						<h3 className="text-lg font-medium">Current Gear</h3>
						<div className="grid gap-4 md:grid-cols-2">
							{currentGear.map((item) => (
								<GearCard
									key={item.id}
									gear={item}
									onEdit={() => setEditingGearId(item.id)}
									onDelete={() => handleDelete(item.id)}
									isAdmin={isAdmin}
								/>
							))}
						</div>
					</div>
				)}

				{retiredGear.length > 0 && (
					<div className="space-y-4">
						<h3 className="text-lg font-medium">Retired Gear</h3>
						<div className="grid gap-4 md:grid-cols-2">
							{retiredGear.map((item) => (
								<GearCard
									key={item.id}
									gear={item}
									onEdit={() => setEditingGearId(item.id)}
									onDelete={() => handleDelete(item.id)}
									isAdmin={isAdmin}
								/>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function GearCard({
	gear,
	onEdit,
	onDelete,
	isAdmin,
}: {
	gear: Gear;
	onEdit: () => void;
	onDelete: () => void;
	isAdmin: boolean;
}) {
	const category = CATEGORIES.find((c) => c.value === gear.category)?.label;

	return (
		<Card className="p-4">
			<div className="space-y-4">
				<div className="flex justify-between items-start">
					<div className="space-y-1">
						<h4 className="font-medium">{gear.name}</h4>
						<p className="text-sm text-gray-500">{gear.brand}</p>
						{gear.model && (
							<p className="text-sm text-gray-500">Model: {gear.model}</p>
						)}
						<p className="text-sm text-gray-500">Category: {category}</p>
					</div>
					<div className="flex space-x-2">
						{isAdmin && (
							<>
								<Button
									variant="outline"
									size="sm"
									onClick={() => onEdit()}
								>
									Edit
								</Button>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => onDelete()}
								>
									Delete
								</Button>
							</>
						)}
					</div>
				</div>
				{gear.description && (
					<p className="text-sm text-gray-600">{gear.description}</p>
				)}
				{gear.purchaseUrl && (
					<a
						href={gear.purchaseUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="text-sm text-blue-600 hover:underline block"
					>
						Purchase Link
					</a>
				)}
				{gear.imageUrl && (
					<img
						src={gear.imageUrl}
						alt={gear.name}
						className="w-full h-48 object-cover rounded-md"
					/>
				)}
			</div>
		</Card>
	);
}

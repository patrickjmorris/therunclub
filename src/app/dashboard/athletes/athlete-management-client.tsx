"use client";

import { useState } from "react";
import { CreateAthleteModal } from "@/app/athletes/components/create-athlete-modal";
import { DataTable } from "@/app/dashboard/components/data-table/data-table";
import {
	getAthleteColumns,
	type AthleteData,
} from "@/app/dashboard/components/athletes/columns";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash } from "lucide-react";
import {
	deleteAthleteAction,
	bulkDeleteAthletesAction,
	type AthleteManagementData,
} from "@/app/actions/athlete-management";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Category {
	id: string;
	name: string;
}

interface AthleteManagementClientProps {
	initialAthletes: AthleteManagementData[];
	initialCategories: Category[];
}

export default function AthleteManagementClient({
	initialAthletes,
	initialCategories,
}: AthleteManagementClientProps) {
	const [athletes, setAthletes] = useState<AthleteData[]>(
		initialAthletes.map((a) => ({
			id: a.id,
			name: a.name,
			slug: a.slug,
			countryName: a.countryName,
			countryCode: a.countryCode,
			disciplines: a.disciplines,
			imageUrl: a.imageUrl,
			createdAt: new Date(a.createdAt),
			updatedAt: new Date(a.updatedAt),
		})),
	);
	const [selectedAthletes, setSelectedAthletes] = useState<AthleteData[]>([]);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [athleteToDelete, setAthleteToDelete] = useState<AthleteData | null>(
		null,
	);
	const router = useRouter();

	const handleEdit = (athlete: AthleteData) => {
		// TODO: Implement edit functionality
		console.log("Edit athlete:", athlete);
	};

	const handleDelete = (athlete: AthleteData) => {
		setAthleteToDelete(athlete);
		setShowDeleteDialog(true);
	};

	const handleBulkDelete = async () => {
		if (selectedAthletes.length > 0) {
			try {
				await bulkDeleteAthletesAction(selectedAthletes.map((a) => a.id));
				setAthletes((current) =>
					current.filter((a) => !selectedAthletes.some((sa) => sa.id === a.id)),
				);
				setSelectedAthletes([]);
				toast.success("Selected athletes deleted successfully");
				router.refresh();
			} catch (error) {
				console.error("Failed to delete athletes:", error);
				toast.error("Failed to delete athletes");
			}
		}
	};

	const confirmDelete = async () => {
		if (athleteToDelete) {
			try {
				await deleteAthleteAction(athleteToDelete.id);
				setAthletes((current) =>
					current.filter((a) => a.id !== athleteToDelete.id),
				);
				toast.success("Athlete deleted successfully");
				router.refresh();
			} catch (error) {
				console.error("Failed to delete athlete:", error);
				toast.error("Failed to delete athlete");
			}
		}
		setShowDeleteDialog(false);
		setAthleteToDelete(null);
	};

	return (
		<div className="container py-8">
			<div className="flex items-center justify-between mb-8">
				<h1 className="text-2xl font-bold">Athlete Management</h1>
				<div className="flex items-center gap-4">
					{selectedAthletes.length > 0 && (
						<Button
							variant="destructive"
							size="sm"
							onClick={handleBulkDelete}
							className="gap-2"
						>
							<Trash className="h-4 w-4" />
							Delete Selected ({selectedAthletes.length})
						</Button>
					)}
					<CreateAthleteModal categories={initialCategories} canEdit={true} />
				</div>
			</div>

			<div className="bg-white dark:bg-gray-800 rounded-lg p-6">
				<DataTable
					columns={getAthleteColumns(handleEdit, handleDelete)}
					data={athletes}
					onRowSelection={setSelectedAthletes}
					filterColumn="name"
					filterPlaceholder="Filter athletes..."
				/>
			</div>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete{" "}
							{athleteToDelete ? `"${athleteToDelete.name}"` : "this athlete"}.
							This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							className="bg-red-600 hover:bg-red-700"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

"use client";

import { useEffect, useState } from "react";

import { DataTable } from "@/app/dashboard/components/data-table/data-table";
import {
	getPodcastColumns,
	type PodcastData,
} from "@/app/dashboard/components/podcasts/columns";
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
	deletePodcast,
	bulkDeletePodcasts,
	getAllPodcastsForManagement,
} from "@/app/actions/podcasts";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AddContentDialog from "@/components/common/content/AddContentDialog";

interface PodcastManagementClientProps {
	initialPodcasts: Awaited<ReturnType<typeof getAllPodcastsForManagement>>;
}

export default function PodcastManagementClient({
	initialPodcasts,
}: PodcastManagementClientProps) {
	const [podcasts, setPodcasts] = useState<PodcastData[]>([]);
	const [selectedPodcasts, setSelectedPodcasts] = useState<PodcastData[]>([]);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [podcastToDelete, setPodcastToDelete] = useState<PodcastData | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		try {
			setPodcasts(
				initialPodcasts.map((p) => ({
					id: p.id,
					title: p.title,
					feedUrl: p.feedUrl,
					imageUrl: p.podcastImage || p.image || null,
					createdAt: new Date(),
					updatedAt: p.updatedAt || new Date(),
				})),
			);
		} catch (error) {
			console.error("Error transforming podcast data:", error);
			toast.error("Error loading podcasts");
		} finally {
			setIsLoading(false);
		}
	}, [initialPodcasts]);

	const handleEdit = (podcast: PodcastData) => {
		// TODO: Implement edit functionality
		console.log("Edit podcast:", podcast);
	};

	const handleDelete = (podcast: PodcastData) => {
		setPodcastToDelete(podcast);
		setShowDeleteDialog(true);
	};

	const handleBulkDelete = async () => {
		if (selectedPodcasts.length > 0) {
			try {
				await bulkDeletePodcasts(selectedPodcasts.map((p) => p.id));
				setPodcasts((current) =>
					current.filter((p) => !selectedPodcasts.some((sp) => sp.id === p.id)),
				);
				setSelectedPodcasts([]);
				toast.success("Selected podcasts deleted successfully");
				router.refresh();
			} catch (error) {
				console.error("Failed to delete podcasts:", error);
				toast.error("Failed to delete podcasts");
			}
		}
	};

	const confirmDelete = async () => {
		if (podcastToDelete) {
			try {
				await deletePodcast(podcastToDelete.id);
				setPodcasts((current) =>
					current.filter((p) => p.id !== podcastToDelete.id),
				);
				toast.success("Podcast deleted successfully");
				router.refresh();
			} catch (error) {
				console.error("Failed to delete podcast:", error);
				toast.error("Failed to delete podcast");
			}
		}
		setShowDeleteDialog(false);
		setPodcastToDelete(null);
	};

	if (isLoading) {
		return (
			<div className="container py-8">
				<div className="flex items-center justify-between mb-8">
					<h1 className="text-2xl font-bold">Podcast Management</h1>
				</div>
				<div className="bg-white dark:bg-gray-800 rounded-lg p-6">
					<div className="h-96 flex items-center justify-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container py-8">
			<div className="flex items-center justify-between mb-8">
				<h1 className="text-2xl font-bold">Podcast Management</h1>
				<div className="flex items-center gap-4">
					{selectedPodcasts.length > 0 && (
						<Button
							variant="destructive"
							size="sm"
							onClick={handleBulkDelete}
							className="gap-2"
						>
							<Trash className="h-4 w-4" />
							Delete Selected ({selectedPodcasts.length})
						</Button>
					)}
					<AddContentDialog defaultTab="podcast" />
				</div>
			</div>

			<div className="bg-white dark:bg-gray-800 rounded-lg p-6">
				<DataTable
					columns={getPodcastColumns(handleEdit, handleDelete)}
					data={podcasts}
					onRowSelection={setSelectedPodcasts}
					filterColumn="title"
					filterPlaceholder="Filter podcasts..."
				/>
			</div>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete{" "}
							{podcastToDelete ? `"${podcastToDelete.title}"` : "this podcast"}.
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

import { ColumnDef } from "@tanstack/react-table";
import { getBaseColumns } from "@/components/dashboard/data-table/columns";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import Image from "next/image";

export interface PodcastData {
	id: string;
	title: string;
	feedUrl: string;
	imageUrl: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export const getPodcastColumns = (
	onEdit: (podcast: PodcastData) => void,
	onDelete: (podcast: PodcastData) => void,
): ColumnDef<PodcastData>[] => [
	...getBaseColumns<PodcastData>(),
	{
		accessorKey: "title",
		header: "Title",
	},
	{
		accessorKey: "imageUrl",
		header: "Image",
		cell: ({ row }) => {
			const imageUrl = row.getValue("imageUrl") as string;
			return imageUrl ? (
				<div className="relative h-10 w-10">
					<Image
						src={imageUrl}
						alt={row.getValue("title")}
						fill
						className="rounded-md object-cover"
					/>
				</div>
			) : null;
		},
	},
	{
		accessorKey: "feedUrl",
		header: "Feed URL",
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const podcast = row.original;

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<span className="sr-only">Open menu</span>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Actions</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={() => onEdit(podcast)}>
							<Pencil className="mr-2 h-4 w-4" />
							Edit
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => onDelete(podcast)}
							className="text-red-600"
						>
							<Trash className="mr-2 h-4 w-4" />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];

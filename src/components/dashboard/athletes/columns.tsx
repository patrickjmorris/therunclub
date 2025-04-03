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

export interface AthleteData {
	id: string;
	name: string;
	slug: string;
	countryName: string | null;
	countryCode: string | null;
	disciplines: string[];
	imageUrl: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export const getAthleteColumns = (
	onEdit: (athlete: AthleteData) => void,
	onDelete: (athlete: AthleteData) => void,
): ColumnDef<AthleteData>[] => [
	...getBaseColumns<AthleteData>(),
	{
		accessorKey: "name",
		header: "Name",
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
						alt={row.getValue("name")}
						fill
						className="rounded-full object-cover"
					/>
				</div>
			) : null;
		},
	},
	{
		accessorKey: "countryName",
		header: "Country",
		cell: ({ row }) => {
			const countryName = row.getValue("countryName") as string;
			const countryCode = row.original.countryCode;
			return countryName ? (
				<div className="flex items-center gap-2">
					{countryCode && (
						<span className="text-xl" aria-hidden="true">
							{String.fromCodePoint(
								...countryCode
									.toUpperCase()
									.split("")
									.map((char) => 127397 + char.charCodeAt(0)),
							)}
						</span>
					)}
					{countryName}
				</div>
			) : null;
		},
	},
	{
		accessorKey: "disciplines",
		header: "Disciplines",
		cell: ({ row }) => {
			const disciplines = row.getValue("disciplines") as string[];
			return disciplines?.length > 0 ? (
				<div className="flex flex-wrap gap-1">
					{disciplines.map((discipline) => (
						<span
							key={discipline}
							className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200"
						>
							{discipline}
						</span>
					))}
				</div>
			) : null;
		},
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const athlete = row.original;

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
						<DropdownMenuItem onClick={() => onEdit(athlete)}>
							<Pencil className="mr-2 h-4 w-4" />
							Edit
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => onDelete(athlete)}
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

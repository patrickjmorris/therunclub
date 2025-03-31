"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface DynamicGearSectionProps {
	athleteSlug: string;
	gear: {
		id: string;
		name: string;
		description: string | null;
		imageUrl: string | null;
		link: string | null;
	}[];
	isAdmin: boolean;
}

// Loading state component
function GearSectionSkeleton() {
	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-semibold dark:text-gray-100">Gear</h2>
				<Skeleton className="h-8 w-24" />
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{[1, 2].map((i) => (
					<div
						key={i}
						className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
					>
						<Skeleton className="h-48 w-full mb-4" />
						<Skeleton className="h-6 w-3/4 mb-2" />
						<Skeleton className="h-4 w-full" />
					</div>
				))}
			</div>
		</div>
	);
}

export function DynamicGearSection({
	athleteSlug,
	gear,
	isAdmin,
}: DynamicGearSectionProps) {
	const [isAdding, setIsAdding] = useState(false);

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-semibold dark:text-gray-100">Gear</h2>
				{isAdmin && (
					<button
						type="button"
						onClick={() => setIsAdding(true)}
						className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
					>
						Add Gear
					</button>
				)}
			</div>

			{gear.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{gear.map((item) => (
						<div
							key={item.id}
							className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
						>
							{item.imageUrl ? (
								<img
									src={item.imageUrl}
									alt={item.name}
									className="h-48 w-full object-contain mb-4"
								/>
							) : (
								<div className="h-48 w-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
									<span className="text-gray-500 dark:text-gray-400">
										{item.name}
									</span>
								</div>
							)}
							<h3 className="text-lg font-medium dark:text-gray-200 mb-2">
								{item.name}
							</h3>
							{item.description && (
								<p className="text-gray-600 dark:text-gray-400 mb-4">
									{item.description}
								</p>
							)}
							{item.link && (
								<a
									href={item.link}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
								>
									View Product
								</a>
							)}
						</div>
					))}
				</div>
			) : (
				<p className="text-gray-500 dark:text-gray-400">No gear listed yet.</p>
			)}
		</div>
	);
}

// Export the loading state component
export { GearSectionSkeleton };

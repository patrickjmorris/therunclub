"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface DynamicSponsorsSectionProps {
	athleteSlug: string;
	sponsors: {
		id: string;
		name: string;
		logoUrl: string | null;
		website: string | null;
	}[];
	isAdmin: boolean;
}

// Loading state component
function SponsorsSectionSkeleton() {
	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-semibold dark:text-gray-100">Sponsors</h2>
				<Skeleton className="h-8 w-24" />
			</div>
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
				{[1, 2, 3, 4].map((i) => (
					<div
						key={i}
						className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
					>
						<Skeleton className="h-24 w-full mb-2" />
						<Skeleton className="h-6 w-3/4 mx-auto" />
					</div>
				))}
			</div>
		</div>
	);
}

export function DynamicSponsorsSection({
	athleteSlug,
	sponsors,
	isAdmin,
}: DynamicSponsorsSectionProps) {
	const [isAdding, setIsAdding] = useState(false);

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-semibold dark:text-gray-100">Sponsors</h2>
				{isAdmin && (
					<button
						type="button"
						onClick={() => setIsAdding(true)}
						className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
					>
						Add Sponsor
					</button>
				)}
			</div>

			{sponsors.length > 0 ? (
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
					{sponsors.map((sponsor) => (
						<div
							key={sponsor.id}
							className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
						>
							{sponsor.logoUrl ? (
								<img
									src={sponsor.logoUrl}
									alt={sponsor.name}
									className="h-24 w-full object-contain mb-2"
								/>
							) : (
								<div className="h-24 w-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg mb-2">
									<span className="text-gray-500 dark:text-gray-400">
										{sponsor.name}
									</span>
								</div>
							)}
							{sponsor.website ? (
								<a
									href={sponsor.website}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 text-center block"
								>
									Visit Website
								</a>
							) : (
								<p className="text-gray-500 dark:text-gray-400 text-center">
									{sponsor.name}
								</p>
							)}
						</div>
					))}
				</div>
			) : (
				<p className="text-gray-500 dark:text-gray-400">
					No sponsors listed yet.
				</p>
			)}
		</div>
	);
}

// Export the loading state component
export { SponsorsSectionSkeleton };

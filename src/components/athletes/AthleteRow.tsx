import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { getCountryFlag } from "@/lib/utils/country-codes";
import { AthleteImage } from "@/components/athletes/AthleteImage";

// Common data structure for athletes in these rows
export interface AthleteRowItem {
	id: string;
	name: string;
	slug: string;
	imageUrl: string | null;
	countryCode: string | null;
}

interface AthleteRowProps {
	title: string;
	athletes: AthleteRowItem[];
}

// Simple Athlete Card for the row
function AthleteCard({ athlete }: { athlete: AthleteRowItem }) {
	return (
		<Link
			href={`/athletes/${athlete.slug}`}
			className="flex flex-col items-center space-y-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow min-w-32"
		>
			<div className="relative w-16 h-16">
				<AthleteImage
					src={athlete.imageUrl}
					name={athlete.name}
					alt={athlete.name}
					width={64}
					height={64}
					className="object-cover rounded-full"
				/>
			</div>
			<div className="text-center">
				<span className="text-sm font-medium dark:text-gray-100">
					{athlete.name}
				</span>
				{athlete.countryCode && (
					<span className="block text-xs text-gray-500 dark:text-gray-400">
						{getCountryFlag(athlete.countryCode)}
					</span>
				)}
			</div>
		</Link>
	);
}

// The main AthleteRow component
export function AthleteRow({ title, athletes }: AthleteRowProps) {
	if (!athletes || athletes.length === 0) {
		return null; // Don't render the row if there are no athletes
	}

	return (
		<div className="mb-8">
			<h2 className="text-xl font-semibold mb-4 dark:text-gray-100">{title}</h2>
			<div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
				{athletes.map((athlete) => (
					<AthleteCard key={athlete.id} athlete={athlete} />
				))}
			</div>
		</div>
	);
}

// Skeleton loader for the AthleteRow
export function AthleteRowSkeleton({ title }: { title: string }) {
	return (
		<div className="mb-8">
			<h2 className="text-xl font-semibold mb-4 dark:text-gray-100">{title}</h2>
			<div className="flex space-x-4 overflow-x-auto pb-4">
				{Array.from({ length: 6 }).map((_, index) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: ok for skeleton
						key={index}
						className="flex flex-col items-center space-y-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow min-w-32"
					>
						<Skeleton className="w-16 h-16 rounded-full" />
						<div className="text-center space-y-1">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-3 w-8 mx-auto" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

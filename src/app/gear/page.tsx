import { Suspense } from "react";
import type { Metadata } from "next";
import { GearFilters } from "@/components/gear/gear-filters";
import { GearCard } from "@/components/gear/gear-card";
import { queryGear } from "@/lib/db/queries/gear";
import { Skeleton } from "@/components/ui/skeleton";
// Assume a pagination component exists or will be created
// import { Pagination } from "@/components/ui/pagination";

export const metadata: Metadata = {
	title: "Browse Gear - The Run Club",
	description: "Find and filter running shoes, apparel, watches, and more.",
};

// Define search parameters type (will be used more later)
interface GearPageProps {
	searchParams: Promise<{
		page?: string;
		limit?: string;
		category?: string;
		brand?: string;
		minPrice?: string;
		maxPrice?: string;
		sort?: string;
		// Add other potential filter params
	}>;
}

// Skeleton for the gear grid
function GearGridSkeleton() {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{[...Array(12)].map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: Static array ok
				<div key={`skel-${i}`}>
					<Skeleton className="aspect-square w-full rounded-md" />
					<div className="mt-2 space-y-1">
						<Skeleton className="h-3 w-1/3" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-1/4" />
					</div>
				</div>
			))}
		</div>
	);
}

// Async component to fetch and display gear
async function GearList({ searchParams }: GearPageProps) {
	// TODO: Parse searchParams properly later to apply filters/pagination
	const resolvedParams = await searchParams;
	const page = parseInt(resolvedParams?.page || "1", 10);
	const limit = parseInt(resolvedParams?.limit || "24", 10); // Default to 24 items
	const offset = (page - 1) * limit;

	// Fetch initial data (or filtered data based on searchParams later)
	const { items: gearItems, totalCount } = await queryGear({
		limit: limit,
		offset: offset,
		// Add filters based on searchParams here later
		// category: searchParams?.category,
		// brand: searchParams?.brand,
		// ...
	});

	// Placeholder pagination logic
	const totalPages = Math.ceil(totalCount / limit);

	return (
		<div className="space-y-6">
			{gearItems.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{gearItems.map((item) => (
						<GearCard key={item.id} item={item} />
					))}
				</div>
			) : (
				<p className="text-center text-muted-foreground">No gear found.</p>
			)}

			{/* TODO: Implement actual Pagination component */}
			{totalPages > 1 && (
				<div className="flex justify-center pt-4">
					{/* Placeholder Pagination */}
					<p>
						Page {page} of {totalPages} (Total: {totalCount})
					</p>
					{/* <Pagination currentPage={page} totalPages={totalPages} /> */}
				</div>
			)}
		</div>
	);
}

export default function GearPage({ searchParams }: GearPageProps) {
	return (
		<div className="container py-8">
			<h1 className="text-3xl font-bold tracking-tight mb-8">Browse Gear</h1>
			<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
				{/* Filters Sidebar */}
				<div className="md:col-span-1">
					{/* Filters component needs state/URL integration later */}
					<GearFilters className="sticky top-20" />
				</div>

				{/* Gear Grid */}
				<main className="md:col-span-3">
					<Suspense fallback={<GearGridSkeleton />}>
						<GearList searchParams={searchParams} />
					</Suspense>
				</main>
			</div>
		</div>
	);
}

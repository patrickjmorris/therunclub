import Link from "next/link";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClubFilters } from "@/app/clubs/club-filters";
import { getClubCities, getClubsData } from "@/lib/services/club-service";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
	title: "Running Clubs",
	description:
		"Find running clubs in New York, Boston, Chicago, and more: meetup schedules, pace groups, and how to join.",
	path: "/clubs",
});

// This ensures the page and data are generated at build time
export const revalidate = 3600; // Revalidate every hour

export default async function ClubsPage() {
	const [{ cities, clubs }, cityPages] = await Promise.all([
		getClubsData(),
		getClubCities(),
	]);
	const cityHrefs = Object.fromEntries(
		cityPages.map((page) => [page.city, `/clubs/city/${page.slug}`]),
	);

	return (
		<div className="container py-8">
			<div className="flex justify-between items-center mb-8">
				<div>
					<h1 className="text-3xl font-bold">Running Clubs</h1>
					<p className="text-muted-foreground mt-2">
						Find and join running clubs in your area
					</p>
				</div>
				<Link href="/clubs/add">
					<Button>Add Club</Button>
				</Link>
			</div>

			<nav aria-label="Running clubs by city" className="mb-8">
				<h2 className="text-sm font-medium text-muted-foreground mb-2">
					Browse by city
				</h2>
				<div className="flex flex-wrap gap-2">
					{cityPages.map((page) => (
						<Link key={page.slug} href={`/clubs/city/${page.slug}`}>
							<Badge variant="secondary" className="hover:bg-muted">
								<MapPin className="h-3 w-3 mr-1" />
								Running clubs in {page.label} ({page.count})
							</Badge>
						</Link>
					))}
				</div>
			</nav>

			<ClubFilters cities={cities} initialClubs={clubs} cityHrefs={cityHrefs} />
		</div>
	);
}

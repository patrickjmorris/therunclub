import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { ClubCard } from "@/app/clubs/club-card";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/common/json-ld";
import { PageBreadcrumbs } from "@/components/common/page-breadcrumbs";
import { getClubCities, getClubsInCity } from "@/lib/services/club-service";
import { itemList, pageMetadata } from "@/lib/seo";

export const dynamic = "force-static";
export const revalidate = 86400;

interface CityPageProps {
	params: Promise<{ city: string }>;
}

async function findCity(slug: string) {
	const cities = await getClubCities();
	return {
		city: cities.find((entry) => entry.slug === slug),
		others: cities.filter((entry) => entry.slug !== slug),
	};
}

export async function generateStaticParams() {
	const cities = await getClubCities();
	return cities.map(({ slug }) => ({ city: slug }));
}

export async function generateMetadata(
	props: CityPageProps,
): Promise<Metadata> {
	const { city } = await findCity((await props.params).city);
	if (!city) return {};
	const clubs = await getClubsInCity(city.city);
	const names = clubs
		.slice(0, 3)
		.map((club) => club.clubName)
		.join(", ");
	return pageMetadata({
		title: `Running Clubs in ${city.label}`,
		description: `${city.count} running clubs and run crews in ${city.label}, including ${names}. Find group runs, Strava clubs, and how to join.`,
		path: `/clubs/city/${city.slug}`,
	});
}

export default async function ClubCityPage(props: CityPageProps) {
	const { city, others } = await findCity((await props.params).city);
	if (!city) notFound();
	const clubs = await getClubsInCity(city.city);
	const path = `/clubs/city/${city.slug}`;

	return (
		<div className="container py-8">
			<PageBreadcrumbs
				items={[
					{ name: "Running Clubs", path: "/clubs" },
					{ name: city.label, path },
				]}
			/>
			<JsonLd
				data={itemList(
					`Running clubs in ${city.label}`,
					clubs.map((club) => ({
						"@type": "SportsClub",
						name: club.clubName,
						url: club.website || undefined,
						sameAs: [
							club.socialMedia?.strava,
							club.socialMedia?.instagram,
						].filter(Boolean),
						address: {
							"@type": "PostalAddress",
							addressLocality: club.city,
							addressCountry: club.location.country,
						},
					})),
				)}
			/>

			<div className="mb-8">
				<h1 className="text-3xl font-bold">Running Clubs in {city.label}</h1>
				<p className="text-muted-foreground mt-2 max-w-2xl">
					{city.count} running clubs and run crews in {city.label}. Each listing
					links to the club&apos;s website, Strava group, or Instagram so you
					can find their next group run.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{clubs.map((club) => (
					<ClubCard key={club.id} club={club} />
				))}
			</div>

			{others.length > 0 && (
				<section className="mt-12">
					<h2 className="text-xl font-semibold mb-4">
						Running clubs in other cities
					</h2>
					<div className="flex flex-wrap gap-2">
						{others.map((other) => (
							<Link key={other.slug} href={`/clubs/city/${other.slug}`}>
								<Badge variant="outline" className="hover:bg-muted">
									<MapPin className="h-3 w-3 mr-1" />
									{other.label} ({other.count})
								</Badge>
							</Link>
						))}
					</div>
				</section>
			)}
		</div>
	);
}

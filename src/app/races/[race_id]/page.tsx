import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { fetchRace } from "@/lib/runsignup-api";
import RaceDetailsView from "./components/RaceDetailsView";
import { JsonLd } from "@/components/common/json-ld";
import { absoluteUrl } from "@/config/site";
import { breadcrumbList, metaDescription, pageMetadata } from "@/lib/seo";

interface RacePageProps {
	params: Promise<{ race_id: string }>;
}

const getRace = cache(async (raceId: string) => {
	if (!/^\d+$/.test(raceId)) return null;
	const response = await fetchRace(raceId);
	return response?.race ?? null;
});

// RunSignup dates are MM/DD/YYYY; schema.org wants ISO 8601.
function isoDate(date: string | undefined) {
	const match = date?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
	return match ? `${match[3]}-${match[1]}-${match[2]}` : undefined;
}

function raceLocation(race: { address?: { city?: string; state?: string } }) {
	return [race.address?.city, race.address?.state].filter(Boolean).join(", ");
}

export async function generateMetadata({
	params,
}: RacePageProps): Promise<Metadata> {
	const { race_id } = await params;
	const race = await getRace(race_id);
	if (!race) return { title: "Race Not Found" };

	const location = raceLocation(race);
	const when = race.next_date ? ` on ${race.next_date}` : "";
	return pageMetadata({
		title: location ? `${race.name} - ${location}` : race.name,
		description: metaDescription(
			race.description,
			`${race.name}${
				location ? ` in ${location}` : ""
			}${when}: course details, distances, and registration.`,
		),
		path: `/races/${race_id}`,
		images: race.logo_url
			? [{ url: race.logo_url, alt: race.name }]
			: undefined,
	});
}

export default async function RaceDetailPage({ params }: RacePageProps) {
	const { race_id } = await params;
	const race = await getRace(race_id);
	if (!race) notFound();

	const path = `/races/${race_id}`;
	return (
		<>
			<JsonLd
				data={[
					{
						"@context": "https://schema.org",
						"@type": "SportsEvent",
						name: race.name,
						url: absoluteUrl(path),
						startDate: isoDate(race.next_date),
						endDate: isoDate(race.next_end_date),
						image: race.logo_url || undefined,
						location: {
							"@type": "Place",
							name: raceLocation(race) || race.name,
							address: {
								"@type": "PostalAddress",
								streetAddress: race.address?.street,
								addressLocality: race.address?.city,
								addressRegion: race.address?.state,
								postalCode: race.address?.zipcode,
								addressCountry: race.address?.country_code,
							},
						},
						offers: race.url ? { "@type": "Offer", url: race.url } : undefined,
					},
					breadcrumbList([
						{ name: "Races", path: "/races" },
						{ name: race.name, path },
					]),
				]}
			/>
			<RaceDetailsView raceData={race} />
		</>
	);
}

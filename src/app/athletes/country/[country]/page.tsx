import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AthleteImage } from "@/components/athletes/AthleteImage";
import { JsonLd } from "@/components/common/json-ld";
import { PageBreadcrumbs } from "@/components/common/page-breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
	type CountryAthlete,
	getAthleteCountries,
	getNotableAthletesInCountry,
} from "@/lib/services/athlete-service";
import { itemList, metaDescription, pageMetadata } from "@/lib/seo";
import { getCountryFlag } from "@/lib/utils/country-codes";

export const dynamic = "force-static";
export const revalidate = 86400;

interface CountryPageProps {
	params: Promise<{ country: string }>;
}

async function findCountry(slug: string) {
	const countries = await getAthleteCountries();
	return {
		country: countries.find((entry) => entry.slug === slug),
		others: countries.filter((entry) => entry.slug !== slug),
	};
}

export async function generateStaticParams() {
	const countries = await getAthleteCountries();
	return countries.map(({ slug }) => ({ country: slug }));
}

export async function generateMetadata(
	props: CountryPageProps,
): Promise<Metadata> {
	const { country } = await findCountry((await props.params).country);
	if (!country) return {};
	const athletes = await getNotableAthletesInCountry(country.code);
	const names = athletes
		.slice(0, 3)
		.map((athlete) => athlete.name)
		.join(", ");
	return pageMetadata({
		title: `Elite Runners from ${country.name}`,
		description: `Profiles of ${country.count} elite runners and track athletes from ${country.name}, including ${names}: bios, results, honors, and podcast mentions.`,
		path: `/athletes/country/${country.slug}`,
	});
}

export default async function AthleteCountryPage(props: CountryPageProps) {
	const { country, others } = await findCountry((await props.params).country);
	if (!country) notFound();
	const athletes = await getNotableAthletesInCountry(country.code);
	const path = `/athletes/country/${country.slug}`;

	return (
		<div className="container mx-auto py-8">
			<PageBreadcrumbs
				items={[
					{ name: "Athletes", path: "/athletes" },
					{ name: country.name, path },
				]}
			/>
			<JsonLd
				data={itemList(
					`Elite runners from ${country.name}`,
					athletes.map((athlete) => ({
						name: athlete.name,
						path: `/athletes/${athlete.slug}`,
					})),
				)}
			/>

			<div className="mb-8 max-w-3xl">
				<h1 className="text-3xl font-bold dark:text-gray-100">
					<span aria-hidden="true" className="mr-2">
						{getCountryFlag(country.code)}
					</span>
					Elite Runners from {country.name}
				</h1>
				<p className="text-muted-foreground mt-2">
					{country.count} runners and track athletes from {country.name} with
					profiles on The Run Club.{" "}
					{athletes.length < country.count
						? `Showing the ${athletes.length} most featured, `
						: "Sorted "}
					by how often they come up on running podcasts and YouTube.
				</p>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{athletes.map((athlete) => (
					<CountryAthleteCard key={athlete.id} athlete={athlete} />
				))}
			</div>

			{others.length > 0 && (
				<section className="mt-12">
					<h2 className="text-xl font-semibold mb-4 dark:text-gray-100">
						Runners from other countries
					</h2>
					<div className="flex flex-wrap gap-2">
						{others.map((other) => (
							<Link key={other.slug} href={`/athletes/country/${other.slug}`}>
								<Badge variant="outline" className="hover:bg-muted">
									{other.name} ({other.count})
								</Badge>
							</Link>
						))}
					</div>
				</section>
			)}
		</div>
	);
}

function CountryAthleteCard({ athlete }: { athlete: CountryAthlete }) {
	return (
		<Card className="hover:shadow-md transition-shadow">
			<Link href={`/athletes/${athlete.slug}`} className="block">
				<CardContent className="flex gap-4 p-4">
					<div className="relative w-16 h-16 shrink-0">
						<AthleteImage
							src={athlete.imageUrl}
							name={athlete.name}
							alt={athlete.name}
							width={64}
							height={64}
							className="object-cover rounded-full"
						/>
					</div>
					<div className="min-w-0 space-y-1">
						<h2 className="font-semibold dark:text-gray-100">{athlete.name}</h2>
						{athlete.mentions > 0 && (
							<p className="text-xs text-muted-foreground">
								{athlete.mentions} podcast and video mention
								{athlete.mentions === 1 ? "" : "s"}
							</p>
						)}
						{athlete.bio && (
							<p className="text-sm text-muted-foreground line-clamp-2">
								{metaDescription(athlete.bio, "")}
							</p>
						)}
					</div>
				</CardContent>
			</Link>
		</Card>
	);
}

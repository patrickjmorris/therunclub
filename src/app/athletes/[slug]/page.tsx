import { db } from "@/db/client";
import { athletes } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getUserRole } from "@/lib/auth-utils";
import { ProfileSection } from "./components/profile-section";
import { SponsorsSection } from "./components/sponsors-section";
import { GearSection } from "./components/gear-section";
import { EventsSection } from "./components/events-section";
import { AthleteProfile } from "./athlete-profile";
import { Metadata } from "next";

async function getAthleteData(slug: string) {
	console.log("Attempting to fetch athlete with slug:", slug);

	const athlete = await db.query.athletes.findFirst({
		where: eq(athletes.slug, slug),
		with: {
			honors: true,
			results: true,
			sponsors: true,
			gear: true,
			events: true,
		},
	});

	console.log(
		"Query result:",
		athlete
			? {
					name: athlete.name,
					slug: athlete.slug,
			  }
			: null,
	);

	if (!athlete) return null;
	return athlete;
}

export async function generateMetadata({
	params,
}: {
	params: { slug: string };
}): Promise<Metadata> {
	const athlete = await getAthleteData(params.slug);

	if (!athlete) {
		return {
			title: "Athlete Not Found",
		};
	}

	return {
		title: athlete.name,
		description: athlete.bio || `Profile page for ${athlete.name}`,
		openGraph: {
			title: athlete.name,
			description: athlete.bio || `Profile page for ${athlete.name}`,
			images: athlete.imageUrl ? [athlete.imageUrl] : [],
		},
	};
}

export async function generateStaticParams() {
	const allAthletes = await db
		.select({ slug: athletes.slug })
		.from(athletes)
		.where(sql`${athletes.slug} IS NOT NULL`);

	return allAthletes.map((athlete) => ({
		slug: athlete.slug,
	}));
}

export default async function AthletePage({
	params,
}: {
	params: { slug: string };
}) {
	console.log("Page params:", params);
	const athlete = await getAthleteData(params.slug);
	console.log("Athlete found:", athlete ? true : false);

	if (!athlete) notFound();

	const userRole = await getUserRole();
	const isAdmin = userRole === "admin";

	return (
		<main className="min-h-screen bg-gray-50 dark:bg-gray-900/50">
			<div className="container mx-auto py-8 px-4">
				<div className="max-w-7xl mx-auto">
					{/* Profile Information */}
					<div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
						<ProfileSection
							athleteId={athlete.id}
							name={athlete.name}
							bio={athlete.bio}
							socialMedia={athlete.socialMedia}
							verified={athlete.verified ?? false}
							imageUrl={athlete.imageUrl}
							countryName={athlete.countryName}
							countryCode={athlete.countryCode}
							isAdmin={isAdmin}
						/>
					</div>

					{/* Two column layout */}
					<div className="mt-8 lg:grid lg:grid-cols-12 lg:gap-8">
						{/* Left column - Stats and Honors */}
						<div className="lg:col-span-4">
							<AthleteProfile athlete={athlete} isAdmin={isAdmin} />
						</div>

						{/* Right column - Sponsors, Gear, Events */}
						<div className="mt-8 lg:mt-0 lg:col-span-8">
							{/* Sponsors Section */}
							<SponsorsSection
								athleteId={athlete.id}
								sponsors={athlete.sponsors}
								isAdmin={isAdmin}
							/>

							{/* Gear Section */}
							<div className="mt-8">
								<GearSection
									athleteId={athlete.id}
									gear={athlete.gear}
									isAdmin={isAdmin}
								/>
							</div>

							{/* Events Section */}
							<div className="mt-8">
								<EventsSection
									athleteId={athlete.id}
									events={athlete.events}
									isAdmin={isAdmin}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}

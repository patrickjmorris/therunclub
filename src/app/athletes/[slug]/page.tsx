import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { eq, isNotNull } from "drizzle-orm";
import { athleteHonors, athletes } from "@/db/schema";
import { ProfileSection } from "./components/profile-section";
import { AthleteProfile } from "./athlete-profile";
import { SponsorsSection } from "./components/sponsors-section";
import { GearSection } from "./components/gear-section";
import { EventsSection } from "./components/events-section";
import AthleteMentionsSection from "./components/mentions-section";
import { getAthleteData } from "@/lib/services/athlete-service";
import { canManageContent } from "@/lib/auth-utils";
import { Suspense } from "react";
import { MentionLoading } from "@/components/common/mention-loading";

// Route segment config
export const dynamic = "force-static";
export const revalidate = 86400; // 1 day

export async function generateStaticParams() {
	console.log("[Build] Starting generateStaticParams for athletes");

	try {
		// Get all athletes with their full data
		const allAthletes = await db
			.select()
			.from(athletes)
			.leftJoin(
				athleteHonors,
				eq(athletes.worldAthleticsId, athleteHonors.athleteId),
			)
			.where(isNotNull(athletes.slug));

		console.log(`[Build] Found ${allAthletes.length} total athletes`);

		// Group by athlete and check if any honor is Olympic
		const athleteMap = new Map();

		for (const record of allAthletes) {
			const athlete = record.athletes;
			const honor = record.athlete_honors;

			if (!athleteMap.has(athlete.id)) {
				athleteMap.set(athlete.id, {
					...athlete,
					honors: honor ? [honor] : [],
				});
			} else if (honor) {
				const existingAthlete = athleteMap.get(athlete.id);
				existingAthlete.honors.push(honor);
			}
		}

		// Filter to only athletes with Olympic medals
		const olympicMedalists = Array.from(athleteMap.values()).filter(
			(athlete) => {
				// Check if the athlete has any Olympic medals
				return athlete.honors.some(
					(honor: {
						competition?: string;
						place?: string;
						discipline?: string;
						mark?: string;
					}) => {
						if (!honor) return false;

						const isOlympicEvent =
							honor.competition?.toLowerCase().includes("olympic") &&
							!honor.competition?.toLowerCase().includes("youth");

						const isMedal =
							honor.place === "1." ||
							honor.place === "2." ||
							honor.place === "3.";

						return isOlympicEvent && isMedal;
					},
				);
			},
		);

		console.log(`[Build] Found ${olympicMedalists.length} Olympic medalists`);

		return olympicMedalists.map((athlete) => ({
			slug: athlete.slug,
		}));
	} catch (error) {
		console.error("[Build] Error in generateStaticParams for athletes:", error);
		return []; // Return empty array instead of failing the build
	}
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const resolvedParams = await params;
	const athlete = await getAthleteData(resolvedParams.slug);

	if (!athlete) {
		return {
			title: "Athlete Not Found",
		};
	}

	const description =
		athlete.bio ||
		`Profile page for ${athlete.name}${
			athlete.countryName ? ` from ${athlete.countryName}` : ""
		}`;
	const imageUrl = athlete.imageUrl || "";

	return {
		title: athlete.name,
		description: description,
		openGraph: {
			type: "profile",
			title: athlete.name,
			description: description,
			siteName: "The Run Club",
			images: athlete.imageUrl
				? [
						{
							url: imageUrl,
							width: 350,
							height: 350,
							alt: athlete.name,
						},
				  ]
				: [],
		},
		twitter: {
			card: "summary_large_image",
			title: athlete.name,
			description: description,
			images: athlete.imageUrl ? [imageUrl] : [],
		},
		alternates: {
			canonical: `/athletes/${athlete.slug}`,
		},
	};
}

export default async function AthletePage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const resolvedParams = await params;
	const [athlete, isAdmin] = await Promise.all([
		getAthleteData(resolvedParams.slug),
		canManageContent(),
	]);

	if (!athlete) {
		notFound();
	}

	if (!athlete.worldAthleticsId) {
		notFound();
	}

	// Prepare structured data for SEO
	const structuredData = {
		"@context": "https://schema.org",
		"@type": "Person",
		name: athlete.name,
		bio: athlete.bio,
		nationality: athlete.countryName,
		image: athlete.imageUrl,
		url: `https://therunclub.com/athletes/${athlete.slug}`,
		sameAs: [
			athlete.socialMedia?.twitter,
			athlete.socialMedia?.instagram,
			athlete.socialMedia?.facebook,
			athlete.socialMedia?.website,
		].filter((url): url is string => typeof url === "string"),
	};

	return (
		<>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON data is generated server-side and safe
				dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
			/>
			<main className="min-h-screen bg-gray-50 dark:bg-gray-900/50">
				<div className="container mx-auto py-8 px-4">
					<div className="max-w-7xl mx-auto">
						{/* Profile Information */}
						<div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
							<ProfileSection
								athleteSlug={athlete.slug}
								name={athlete.name}
								bio={athlete.bio}
								imageUrl={athlete.imageUrl}
								countryName={athlete.countryName}
								countryCode={athlete.countryCode}
								socialMedia={athlete.socialMedia}
								verified={athlete.verified ?? undefined}
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
									athleteSlug={athlete.slug}
									sponsors={athlete.sponsors.map((sponsor) => ({
										id: sponsor.id,
										name: sponsor.name,
										website: sponsor.website,
										logo: sponsor.logo,
										startDate: sponsor.startDate,
										endDate: sponsor.endDate,
										isPrimary: sponsor.isPrimary,
									}))}
									isAdmin={isAdmin}
								/>

								{/* Gear Section */}
								<div className="mt-8">
									<GearSection
										athleteSlug={athlete.slug}
										gear={athlete.gear.map((item) => ({
											id: item.id,
											name: item.name,
											brand: item.brand || "",
											category: item.category || "other",
											model: item.model,
											description: item.description,
											purchaseUrl: item.purchaseUrl,
											imageUrl: item.imageUrl,
											isCurrent: item.isCurrent,
										}))}
										isAdmin={isAdmin}
									/>
								</div>

								{/* Events Section */}
								<div className="mt-8">
									<EventsSection
										athleteSlug={athlete.slug}
										events={athlete.events.map((event) => ({
											id: event.id,
											name: event.name,
											date: event.date,
											location: event.location,
											discipline: event.discipline,
											description: event.description,
											website: event.website,
											status: event.status,
											result: event.result
												? {
														place: event.result.place ? 1 : undefined,
														time: event.result.time || undefined,
														notes: event.result.notes || undefined,
												  }
												: undefined,
										}))}
										isAdmin={isAdmin}
									/>
								</div>

								{/* Recent Mentions Section */}
								<div className="mt-8">
									<Suspense
										fallback={<MentionLoading title="Recent Mentions" />}
									>
										<AthleteMentionsSection
											athleteId={athlete.worldAthleticsId || ""}
										/>
									</Suspense>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</>
	);
}

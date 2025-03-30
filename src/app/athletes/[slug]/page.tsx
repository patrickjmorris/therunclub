import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getUserRole } from "@/lib/auth-utils";
import { ProfileSection } from "./components/profile-section";
import { SponsorsSection } from "./components/sponsors-section";
import { GearSection } from "./components/gear-section";
import { EventsSection } from "./components/events-section";
import { AthleteProfile } from "./athlete-profile";
import { Metadata } from "next";
import { AthleteMentions } from "@/components/athlete-mentions";
import { MentionLoading } from "@/components/mention-loading";
import { MentionError } from "@/components/mention-error";
import {
	getAthleteRecentMentions,
	getAthleteData,
	getAllAthletes,
} from "@/lib/services/athlete-service";
import { db } from "@/db/client";
import { athletes, athleteHonors } from "@/db/schema";
import { and, eq, isNotNull, ilike } from "drizzle-orm";

export const revalidate = 86400; // Revalidate every day

async function AthleteMentionsSection({ athleteId }: { athleteId: string }) {
	try {
		const mentions = await getAthleteRecentMentions(athleteId);
		return <AthleteMentions mentions={mentions} />;
	} catch (error) {
		console.error("Error loading athlete mentions:", error);
		return (
			<MentionError
				title="Error Loading Mentions"
				message="Unable to load recent mentions for this athlete."
			/>
		);
	}
}

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
							honor.competition?.toLowerCase().includes("olympic") ||
							honor.competition?.toLowerCase().includes("olympics");

						const isMedal =
							honor.place === "1st" ||
							honor.place === "2nd" ||
							honor.place === "3rd" ||
							honor.place?.toLowerCase().includes("gold") ||
							honor.place?.toLowerCase().includes("silver") ||
							honor.place?.toLowerCase().includes("bronze");

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

export default async function AthletePage(props: {
	params: Promise<{ slug: string }>;
}) {
	const params = await props.params;
	const athlete = await getAthleteData(params.slug);

	if (!athlete) notFound();

	const userRole = await getUserRole();
	const isAdmin = userRole === "admin";

	// Prepare JSON-LD structured data
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Person",
		name: athlete.name,
		description: athlete.bio,
		nationality: athlete.countryName,
		image: athlete.imageUrl,
		url: `https://therunclub.xyz/athletes/${athlete.slug}`,
		sameAs: [
			athlete.socialMedia?.twitter &&
				`https://x.com/${athlete.socialMedia.twitter}`,
			athlete.socialMedia?.instagram &&
				`https://instagram.com/${athlete.socialMedia.instagram}`,
			athlete.socialMedia?.facebook,
			athlete.socialMedia?.website,
		].filter(Boolean),
		award: athlete.honors.map((honor) => ({
			"@type": "Award",
			name: `${honor.place} place in ${honor.competition}`,
			description: `${honor.discipline} - ${honor.mark}`,
		})),
	};

	return (
		<>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON data is generated server-side and safe
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
									athleteSlug={athlete.slug}
									sponsors={athlete.sponsors}
									isAdmin={isAdmin}
								/>

								{/* Gear Section */}
								<div className="mt-8">
									<GearSection
										athleteSlug={athlete.slug}
										gear={athlete.gear}
										isAdmin={isAdmin}
									/>
								</div>

								{/* Events Section */}
								<div className="mt-8">
									<EventsSection
										athleteSlug={athlete.slug}
										events={athlete.events}
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

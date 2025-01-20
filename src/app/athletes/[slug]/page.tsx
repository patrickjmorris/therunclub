import { db } from "@/db/client";
import { Suspense } from "react";
import { athletes } from "@/db/schema";
import { eq } from "drizzle-orm";
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
import { getAthleteRecentMentions } from "@/lib/queries/athlete-mentions";

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

	if (!athlete) return null;
	return athlete;
}

async function AthleteMentionsSection({ athleteId }: { athleteId: string }) {
	try {
		const mentions = await getAthleteRecentMentions(athleteId);
		console.log("Mentions:", mentions);
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
										<AthleteMentionsSection athleteId={athlete.id} />
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

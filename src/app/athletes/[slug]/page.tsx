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
import { GearRow } from "@/components/gear/gear-row";
import { getGearByAthleteId } from "@/lib/db/queries/gear";
import { Skeleton } from "@/components/ui/skeleton";
import { metaDescription, pageMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/config/site";
import { JsonLd } from "@/components/common/json-ld";
import { breadcrumbList } from "@/lib/seo";

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

	return pageMetadata({
		title: athlete.name,
		description: metaDescription(
			athlete.bio,
			`Profile page for ${athlete.name}${
				athlete.countryName ? ` from ${athlete.countryName}` : ""
			}`,
		),
		path: `/athletes/${athlete.slug}`,
		images: athlete.imageUrl
			? [{ url: athlete.imageUrl, alt: athlete.name }]
			: undefined,
		type: "profile",
	});
}

// Skeleton for the athlete gear section
function AthleteGearSkeleton() {
	return (
		<section className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
			<Skeleton className="h-7 w-40 mb-4" /> {/* Section title */}
			<div className="flex space-x-4 overflow-hidden pb-4">
				{[...Array(3)].map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: Static array ok
					<div key={`gear-skel-${i}`} className="w-48 flex-shrink-0 md:w-56">
						<Skeleton className="aspect-square w-full rounded-md" />
						<div className="mt-2 space-y-1">
							<Skeleton className="h-3 w-1/3" /> {/* Brand */}
							<Skeleton className="h-4 w-full" /> {/* Name */}
							<Skeleton className="h-4 w-1/4" /> {/* Price */}
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

// Async component to fetch and display athlete's gear
async function AthleteGearSection({ athleteId }: { athleteId: string }) {
	const athleteGear = await getGearByAthleteId(athleteId);

	if (!athleteGear || athleteGear.length === 0) {
		return null; // Don't render the section if no gear is linked
	}

	return (
		<div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
			{/* Removed extra margin-top from here, applied to wrapper */}
			<GearRow title="Gear They Use" items={athleteGear} />
		</div>
	);
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

	// Use athlete.id (UUID) which comes from the profiles table via getAthleteData
	const athleteUuid = athlete.id;
	if (!athleteUuid) {
		console.error(
			"Athlete UUID (profile ID) is missing for slug:",
			athlete.slug,
		);
		// Decide how to handle this - maybe don't render gear?
	}

	// Prepare structured data for SEO
	const structuredData = {
		"@context": "https://schema.org",
		"@type": "Person",
		name: athlete.name,
		description: athlete.bio || undefined,
		nationality: athlete.countryName
			? { "@type": "Country", name: athlete.countryName }
			: undefined,
		image: athlete.imageUrl || undefined,
		url: absoluteUrl(`/athletes/${athlete.slug}`),
		sameAs: [
			athlete.socialMedia?.twitter,
			athlete.socialMedia?.instagram,
			athlete.socialMedia?.facebook,
			athlete.socialMedia?.website,
		].filter((url): url is string => Boolean(url)),
	};

	return (
		<>
			<JsonLd
				data={[
					structuredData,
					breadcrumbList([
						{ name: "Athletes", path: "/athletes" },
						{ name: athlete.name, path: `/athletes/${athlete.slug}` },
					]),
				]}
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

							{/* Right column - Sponsors, Gear, Events, Mentions */}
							<div className="mt-8 lg:mt-0 lg:col-span-8 space-y-8">
								{/* Sponsors Section (Commented out) */}
								{/* <SponsorsSection ... /> */}

								{/* === NEW Athlete Gear Section === */}
								{athleteUuid && ( // Only render if we have the athlete's UUID
									<Suspense fallback={<AthleteGearSkeleton />}>
										<AthleteGearSection athleteId={athleteUuid} />
									</Suspense>
								)}
								{/* ============================== */}

								{/* Events Section */}
								<EventsSection
									athleteSlug={athlete.slug}
									events={
										athlete.events?.map((event) => ({
											// Ensure correct mapping based on actual event structure
											id: event.id,
											name: event.name,
											date: event.date,
											location: event.location,
											discipline: event.discipline,
											description: event.description,
											website: event.website,
											status: event.status,
											result: event.result,
										})) ?? []
									}
									isAdmin={isAdmin}
								/>

								{/* Mentions Section */}
								{athlete.worldAthleticsId && (
									<Suspense fallback={<MentionLoading />}>
										<AthleteMentionsSection
											athleteId={athlete.worldAthleticsId}
										/>
									</Suspense>
								)}
							</div>
						</div>
					</div>
				</div>
			</main>
		</>
	);
}

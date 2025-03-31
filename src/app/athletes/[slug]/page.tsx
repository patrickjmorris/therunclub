import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { eq } from "drizzle-orm";
import { athletes } from "@/db/schema";
import { ProfileSection } from "./components/profile-section";
import { AthleteMentions } from "@/components/athlete-mentions";
import {
	AthleteWithRelations,
	Sponsor,
	GearItem,
	Event,
} from "@/types/athlete";
import {
	getAthleteData,
	getAthleteRecentMentions,
} from "@/lib/services/athlete-service";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { nanoid } from "nanoid";
import { canManageContent } from "@/lib/auth-utils";

// Dynamically import components with loading states
const DynamicAthleteProfile = dynamic(
	() => import("./athlete-profile").then((mod) => mod.AthleteProfile),
	{ loading: () => <AthleteProfileSkeleton /> },
);

const DynamicSponsorsSection = dynamic(
	() =>
		import("./components/sponsors-section").then((mod) => mod.SponsorsSection),
	{ loading: () => <SponsorsSectionSkeleton /> },
);

const DynamicGearSection = dynamic(
	() => import("./components/gear-section").then((mod) => mod.GearSection),
	{ loading: () => <GearSectionSkeleton /> },
);

const DynamicEventsSection = dynamic(
	() => import("./components/events-section").then((mod) => mod.EventsSection),
	{ loading: () => <EventsSectionSkeleton /> },
);

// Loading state components
function AthleteProfileSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-8 w-1/3" />
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-2/3" />
		</div>
	);
}

function SponsorsSectionSkeleton() {
	const skeletonKeys = Array.from({ length: 3 }, () => nanoid());
	return (
		<div className="space-y-6">
			<Skeleton className="h-8 w-1/3" />
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{skeletonKeys.map((key) => (
					<Skeleton key={key} className="h-32" />
				))}
			</div>
		</div>
	);
}

function GearSectionSkeleton() {
	const skeletonKeys = Array.from({ length: 3 }, () => nanoid());
	return (
		<div className="space-y-6">
			<Skeleton className="h-8 w-1/3" />
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{skeletonKeys.map((key) => (
					<Skeleton key={key} className="h-32" />
				))}
			</div>
		</div>
	);
}

function EventsSectionSkeleton() {
	const skeletonKeys = Array.from({ length: 3 }, () => nanoid());
	return (
		<div className="space-y-6">
			<Skeleton className="h-8 w-1/3" />
			<div className="space-y-4">
				{skeletonKeys.map((key) => (
					<Skeleton key={key} className="h-24" />
				))}
			</div>
		</div>
	);
}

async function AthleteMentionsSection({ athleteId }: { athleteId: string }) {
	try {
		const mentions = await getAthleteRecentMentions(athleteId);
		return <AthleteMentions mentions={mentions} />;
	} catch (error) {
		console.error("Error loading athlete mentions:", error);
		return (
			<div className="text-red-500">
				Unable to load recent mentions for this athlete.
			</div>
		);
	}
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const athlete = await db.query.athletes.findFirst({
		where: eq(athletes.slug, slug),
		columns: {
			name: true,
			bio: true,
			imageUrl: true,
		},
	});

	if (!athlete) {
		return {
			title: "Athlete Not Found",
			description: "The requested athlete could not be found.",
		};
	}

	return {
		title: `${athlete.name} | The Run Club`,
		description: athlete.bio || `Profile of ${athlete.name}`,
		openGraph: {
			title: `${athlete.name} | The Run Club`,
			description: athlete.bio || `Profile of ${athlete.name}`,
			images: athlete.imageUrl ? [athlete.imageUrl] : [],
		},
	};
}

export async function generateStaticParams() {
	const params = await Promise.resolve({});
	const allAthletes = await db.query.athletes.findMany({
		columns: {
			slug: true,
		},
	});

	return allAthletes.map((athlete) => ({
		slug: athlete.slug,
	}));
}

export default async function AthletePage({
	params,
}: {
	params: { slug: string };
}) {
	const [athlete, isAdmin] = await Promise.all([
		getAthleteData(params.slug),
		canManageContent(),
	]);

	if (!athlete) {
		notFound();
	}

	if (!athlete.worldAthleticsId) {
		notFound();
	}

	// Transform data to match component prop types
	const transformedSponsors: Sponsor[] = athlete.sponsors.map((sponsor) => ({
		id: sponsor.id,
		name: sponsor.name,
		logoUrl: sponsor.logo,
		website: sponsor.website,
	}));

	const transformedGear: GearItem[] = athlete.gear.map((item) => ({
		id: item.id,
		name: item.name,
		description: item.description,
		imageUrl: item.imageUrl,
		link: item.purchaseUrl,
	}));

	const transformedEvents: Event[] = athlete.events.map((event) => ({
		id: event.id,
		name: event.name,
		date: event.date,
		location: event.location,
		discipline: event.discipline,
		status: event.status as "upcoming" | "completed" | "cancelled",
		result: event.result
			? {
					place: event.result.place?.toString() ?? null,
					time: event.result.time ?? null,
					notes: event.result.notes ?? null,
			  }
			: null,
	}));

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
								<DynamicAthleteProfile athlete={athlete} isAdmin={isAdmin} />
							</div>

							{/* Right column - Sponsors, Gear, Events */}
							<div className="mt-8 lg:mt-0 lg:col-span-8">
								{/* Sponsors Section */}
								<DynamicSponsorsSection
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
									<DynamicGearSection
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
									<DynamicEventsSection
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
									<Suspense fallback={<EventsSectionSkeleton />}>
										<AthleteMentionsSection
											athleteId={athlete.worldAthleticsId}
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

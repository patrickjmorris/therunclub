import { db } from "@/db/client";
import {
	athletes,
	athleteHonors,
	athleteResults,
	athleteSponsors,
	athleteGear,
	athleteEvents,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getUserRole } from "@/lib/auth-utils";
import { ProfileSection } from "./components/profile-section";
import { SponsorsSection } from "./components/sponsors-section";
import { GearSection } from "./components/gear-section";
import { EventsSection } from "./components/events-section";
import { AthleteProfile } from "./athlete-profile";

async function getAthleteData(id: string) {
	const athlete = await db.query.athletes.findFirst({
		where: eq(athletes.id, id),
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

export default async function AthletePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const athlete = await getAthleteData(id);
	if (!athlete) notFound();

	const userRole = await getUserRole();
	const isAdmin = userRole === "admin";

	return (
		<main className="container mx-auto py-8 px-4">
			<div className="max-w-7xl mx-auto">
				{/* Profile Information */}
				<ProfileSection
					athleteId={athlete.id}
					name={athlete.name}
					bio={athlete.bio}
					socialMedia={athlete.socialMedia}
					verified={athlete.verified ?? false}
					imageUrl={athlete.imageUrl}
					isAdmin={isAdmin}
				/>

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
		</main>
	);
}

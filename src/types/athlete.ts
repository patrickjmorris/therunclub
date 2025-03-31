import {
	athletes,
	athleteSponsors,
	athleteGear,
	athleteEvents,
	athleteHonors,
	athleteResults,
} from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";

// Base types from Drizzle schema
export type Athlete = InferSelectModel<typeof athletes>;
export type AthleteSponsor = InferSelectModel<typeof athleteSponsors>;
export type AthleteGear = InferSelectModel<typeof athleteGear>;
export type AthleteEvent = InferSelectModel<typeof athleteEvents>;
export type AthleteHonor = InferSelectModel<typeof athleteHonors>;
export type AthleteResult = InferSelectModel<typeof athleteResults>;

// Extended types with relations
export type AthleteWithRelations = Athlete & {
	sponsors: AthleteSponsor[];
	gear: AthleteGear[];
	events: AthleteEvent[];
	honors: AthleteHonor[];
	results: AthleteResult[];
};

// Component prop types
export type AthleteProfileProps = {
	athlete: AthleteWithRelations;
	isAdmin: boolean;
};

export type Sponsor = {
	id: string;
	name: string;
	logoUrl: string | null;
	website: string | null;
};

export type SponsorsSectionProps = {
	athleteSlug: string;
	sponsors: Sponsor[];
	isAdmin: boolean;
};

export type GearItem = {
	id: string;
	name: string;
	description: string | null;
	imageUrl: string | null;
	link: string | null;
};

export type GearSectionProps = {
	athleteSlug: string;
	gear: GearItem[];
	isAdmin: boolean;
};

export type Event = {
	id: string;
	name: string;
	date: string;
	location: string | null;
	discipline: string | null;
	status: "upcoming" | "completed" | "cancelled";
	result: {
		place: string | null;
		time: string | null;
		notes: string | null;
	} | null;
};

export type EventsSectionProps = {
	athleteSlug: string;
	events: Event[];
	isAdmin: boolean;
};

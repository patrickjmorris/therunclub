// TypeScript types for RunSignup API responses
// Response for /Rest/races (list of races)
export interface RunSignupRacesResponse {
	races: { race: RunSignupRace }[];
	total_results: number;
	page: number;
	per_page: number;
}

// Response for /Rest/race/:race_id (single race with events)
export interface RunSignupRaceResponse {
	race: RunSignupRace;
}

export interface EventAddress {
	street: string;
	street2: string;
	city: string;
	state: string;
	zipcode: string;
	country_code: string;
}

export interface RegistrationPeriod {
	registration_opens: string;
	registration_closes: string;
	race_fee: string;
	processing_fee: string;
}

export interface EventDetails {
	event_id: number;
	race_event_days_id: number;
	name: string;
	details: string;
	start_time: string;
	end_time: string;
	age_calc_base_date: string | null;
	registration_opens: string;
	event_type: string;
	distance: string;
	volunteer: string;
	require_dob: string;
	require_phone: string;
	registration_periods: RegistrationPeriod[];
	giveaway?: string;
	participant_cap: number;
}

export interface RunSignupRace {
	race_id: number;
	name: string;
	last_date: string;
	last_end_date: string;
	next_date: string;
	next_end_date: string;
	is_draft_race: string;
	is_private_race: string;
	is_registration_open: string;
	created: string;
	last_modified: string;
	description: string;
	url: string;
	external_race_url: string | null;
	external_results_url: string | null;
	fb_page_id: string | null;
	fb_event_id: number | null;
	address: EventAddress;
	timezone: string;
	logo_url: string;
	real_time_notifications_enabled: string;
	events?: EventDetails[]; // Only present in single race fetch
}

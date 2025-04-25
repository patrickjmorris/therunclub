import { ReactNode } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { type User } from "@supabase/supabase-js";
import { AuthSessionMissingError } from "@supabase/supabase-js";
import { AuthProvider } from "./auth-context"; // Import the client provider

// This component only runs on the server
export async function ServerAuthWrapper({ children }: { children: ReactNode }) {
	const cookieStore = await cookies();
	const supabase = createServerClient(
		// biome-ignore lint/style/noNonNullAssertion: env vars must be defined
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		// biome-ignore lint/style/noNonNullAssertion: env vars must be defined
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				get: (name: string) => cookieStore.get(name)?.value,
			},
		},
	);

	// Use getUser() for security - it revalidates the session server-side
	let user: User | null = null;
	try {
		const { data, error } = await supabase.auth.getUser();
		if (error) {
			// Check only the error message string
			if (error.message !== "Auth session missing!") {
				// Log only genuinely unexpected errors
				console.error(
					"[ServerAuthWrapper] Unexpected error getting user:",
					error,
				);
			}
			// If the message is "Auth session missing!", do nothing.
		} else {
			user = data.user;
		}
	} catch (err) {
		// Catch any other unexpected errors during the getUser call
		console.error("[ServerAuthWrapper] Exception during getUser call:", err);
	}

	let profile = null;
	if (user?.email) {
		// Check email on the user object from getUser()
		try {
			const { data: profileData, error: profileError } = await supabase
				.from("profiles")
				.select("full_name, avatar_url")
				.eq("id", user.id)
				.maybeSingle();

			if (profileError) {
				console.error(
					"[ServerAuthWrapper] Error fetching profile:",
					profileError,
				);
			}

			if (profileData) {
				profile = {
					id: user.id,
					// biome-ignore lint/style/noNonNullAssertion: email checked above
					email: user.email!,
					fullName: profileData.full_name ?? null,
					avatarUrl: profileData.avatar_url ?? null,
				};
			} else {
				// Handle case where user exists but profile row doesn't (e.g., signup race condition)
				profile = {
					id: user.id,
					// biome-ignore lint/style/noNonNullAssertion: email checked above
					email: user.email!,
					fullName: null,
					avatarUrl: null,
				};
			}
		} catch (err) {
			console.error("[ServerAuthWrapper] Unexpected profile fetch error:", err);
			// Ensure profile is at least basic if fetch errors unexpectedly
			profile = {
				id: user.id,
				// biome-ignore lint/style/noNonNullAssertion: email checked above
				email: user.email!,
				fullName: null,
				avatarUrl: null,
			};
		}
	} else if (user && !user.email) {
		console.warn(
			"[ServerAuthWrapper] User object exists but email is missing:",
			user.id,
		);
	}

	// Render the client AuthProvider, passing server-fetched data as props
	return (
		<AuthProvider initialUser={user} initialProfile={profile}>
			{children}
		</AuthProvider>
	);
}

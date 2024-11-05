import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
	const cookieStore = await cookies();

	return createServerClient(
		// biome-ignore lint/style/noNonNullAssertion: needed for SSR
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		// biome-ignore lint/style/noNonNullAssertion: needed for SSR
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(cookiesToSet) {
					try {
						for (const { name, value, options } of cookiesToSet) {
							cookieStore.set(name, value, options);
						}
					} catch {
						// The `setAll` method was called from a Server Component.
						// This can be ignored if you have middleware refreshing
						// user sessions.
					}
				},
			},
		},
	);
}

export async function getSession() {
	const supabase = await createClient();
	try {
		const {
			data: { session },
		} = await supabase.auth.getSession();
		return session;
	} catch (error) {
		return null;
	}
}

export async function getUserDetails() {
	const session = await getSession();
	if (!session?.user) return null;

	return session.user;
}

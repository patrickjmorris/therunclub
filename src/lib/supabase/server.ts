import { createServerClient, type CookieOptions } from "@supabase/ssr";
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
				get(name: string) {
					return cookieStore.get(name)?.value;
				},
				set(name: string, value: string, options: CookieOptions) {
					try {
						cookieStore.set({ name, value, ...options });
					} catch (error) {
						// Handle cookie errors in development due to hot reload
					}
				},
				remove(name: string, options: CookieOptions) {
					try {
						cookieStore.delete({ name, ...options });
					} catch (error) {
						// Handle cookie errors in development due to hot reload
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

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
	return createBrowserClient(
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
	);
}

export async function getUser() {
	const supabase = createClient();
	try {
		const {
			data: { user },
		} = await supabase.auth.getUser();
		return user;
	} catch (error) {
		return null;
	}
}

export async function signOut() {
	const supabase = createClient();
	await supabase.auth.signOut();
}

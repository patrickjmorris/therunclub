import { createClient } from "@/utils/supabase/server";
import { getUserRole } from "./auth-utils";

interface User {
	id: string;
	email: string;
	role: "admin" | "editor" | "user";
}

interface Session {
	user: User | null;
}

export async function auth(): Promise<Session | null> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return null;
	}

	const role = await getUserRole();

	return {
		user: {
			id: user.id,
			email: user.email || "",
			role: role || "user",
		},
	};
}

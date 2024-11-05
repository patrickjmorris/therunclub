import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function protectedRoute() {
	const supabase = await createClient();
	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (!session) {
		redirect("/login");
	}

	return session;
}

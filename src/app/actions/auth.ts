"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { profiles, insertProfileSchema } from "@/db/schema";
import { redirect } from "next/navigation";

interface SignUpData {
	email: string;
	password: string;
	fullName?: string;
}

interface SignInData {
	email: string;
	password: string;
}

export async function signIn(data: SignInData) {
	const supabase = await createClient();

	const { error } = await supabase.auth.signInWithPassword({
		email: data.email,
		password: data.password,
	});

	if (error) {
		return { error: error.message };
	}

	revalidatePath("/", "layout");
	redirect("/dashboard");
}

export async function signUp(data: SignUpData) {
	const supabase = await createClient();

	const { error, data: authData } = await supabase.auth.signUp({
		email: data.email,
		password: data.password,
		options: {
			emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
			data: {
				full_name: data.fullName,
			},
		},
	});

	if (error) {
		return { error: error.message };
	}

	// Create profile record in our database
	if (authData?.user?.id && authData?.user?.email) {
		const profileData = {
			id: authData.user.id,
			email: authData.user.email,
			fullName: data.fullName,
		};

		// Validate profile data
		const validatedData = insertProfileSchema.parse(profileData);

		await db.insert(profiles).values(validatedData);
	}

	revalidatePath("/", "layout");
	redirect("/verify-email");
}

export async function signOut() {
	const supabase = await createClient();
	const { error } = await supabase.auth.signOut();

	if (error) {
		return { error: error.message };
	}

	revalidatePath("/", "layout");
	redirect("/login");
}

export async function resetPassword(email: string) {
	const supabase = await createClient();
	const { error } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
	});

	if (error) {
		return { error: error.message };
	}

	return { success: true };
}

export async function updatePassword(password: string) {
	const supabase = await createClient();
	const { error } = await supabase.auth.updateUser({
		password,
	});

	if (error) {
		return { error: error.message };
	}

	return { success: true };
}

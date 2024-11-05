"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { z } from "zod";

const loginSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function login(formData: FormData) {
	const supabase = await createClient();

	const data = {
		email: formData.get("email"),
		password: formData.get("password"),
	};

	// Validate input
	const result = loginSchema.safeParse(data);
	if (!result.success) {
		const errorMessage = result.error.errors[0]?.message || "Invalid input";
		return redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
	}

	const { error } = await supabase.auth.signInWithPassword({
		...result.data,
	});

	if (error) {
		const errorMessage =
			error.message === "Invalid login credentials"
				? "Invalid credentials"
				: "An error occurred. Please try again.";
		return redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
	}

	revalidatePath("/", "layout");
	redirect("/dashboard");
}

export async function signup(formData: FormData) {
	const supabase = await createClient();

	const data = {
		email: formData.get("email"),
		password: formData.get("password"),
	};

	// Validate input
	const result = loginSchema.safeParse(data);
	if (!result.success) {
		const errorMessage = result.error.errors[0]?.message || "Invalid input";
		return redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
	}

	const { error, data: authData } = await supabase.auth.signUp({
		...result.data,
		options: {
			emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
		},
	});

	if (error) {
		const errorMessage = error.message.includes("already registered")
			? "This email is already registered"
			: "Signup failed. Please try again.";
		return redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
	}

	if (authData?.user?.id && authData?.user?.email) {
		await db.insert(profiles).values({
			id: authData.user.id,
			email: authData.user.email,
		});
		console.log(`Profile created successfully for ${authData.user.email}`);
	}

	revalidatePath("/", "layout");
	redirect("/verify-email");
}

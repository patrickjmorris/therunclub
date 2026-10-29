"use server";

import { createClient } from "@/utils/supabase/server";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function getUserId() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) throw new Error("Not authenticated");
	return { supabase, userId: user.id };
}

export async function updateProfile(data: {
	fullName: string;
	avatarUrl?: string;
}) {
	try {
		const { userId } = await getUserId();

		await db
			.update(profiles)
			.set({
				fullName: data.fullName,
				avatarUrl: data.avatarUrl,
				updatedAt: new Date(),
			})
			.where(eq(profiles.id, userId));

		revalidatePath("/profile");
		return { success: true };
	} catch (error) {
		console.error("Error updating profile:", error);
		return { error: "Failed to update profile" };
	}
}

export async function uploadAvatar(file: File) {
	try {
		const { supabase, userId } = await getUserId();

		const fileExt = file.name.split(".").pop();
		const fileName = `${userId}/${Date.now()}.${fileExt}`;

		const { error: uploadError, data } = await supabase.storage
			.from("avatars")
			.upload(fileName, file, {
				upsert: true,
				cacheControl: "3600",
			});

		if (uploadError) throw uploadError;

		const {
			data: { publicUrl },
		} = supabase.storage.from("avatars").getPublicUrl(fileName);

		return { publicUrl };
	} catch (error) {
		console.error("Error uploading avatar:", error);
		return { error: "Failed to upload avatar" };
	}
}

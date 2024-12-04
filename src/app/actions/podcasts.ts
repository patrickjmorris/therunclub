"use server";

import { z } from "zod";
import { addNewPodcast } from "@/db";
import { revalidatePath } from "next/cache";
import type { Podcast } from "@/db/schema";

export const addPodcastSchema = z.object({
	feedUrl: z.string().url("Please enter a valid URL"),
});

export type AddPodcastState = {
	errors?: {
		feedUrl?: string[];
		_form?: string[];
	};
	message: string | null;
	data?: Podcast;
};

export async function addPodcast(
	prevState: AddPodcastState,
	formData: FormData,
): Promise<AddPodcastState> {
	const validatedFields = addPodcastSchema.safeParse({
		feedUrl: formData.get("feedUrl"),
	});

	if (!validatedFields.success) {
		return {
			errors: validatedFields.error.flatten().fieldErrors,
			message: "Invalid feed URL",
		};
	}

	try {
		const result = await addNewPodcast(validatedFields.data.feedUrl);

		if (!result.success) {
			return {
				errors: {
					_form: [result.error || "Failed to add podcast"],
				},
				message: "Failed to add podcast",
			};
		}

		revalidatePath("/podcasts");

		return {
			data: result.podcast,
			message: "Podcast added successfully",
		};
	} catch (error) {
		return {
			errors: {
				_form: ["An unexpected error occurred"],
			},
			message: "An unexpected error occurred",
		};
	}
}

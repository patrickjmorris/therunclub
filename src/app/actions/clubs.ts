"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { db } from "@/db";
import { runningClubs } from "@/db/schema";
import { extractClubInfo } from "@/lib/services/openai-service";
import { revalidatePath } from "next/cache";

// Input validation schema
const schema = z.object({
	text: z.string().min(1, "Club information is required"),
});

// Action handler
export const extractClubInfo_Action = createSafeActionClient()
	.schema(schema)
	.action(async ({ parsedInput: { text } }) => {
		try {
			console.log("Extracting club info from:", text);
			const extractedInfo = await extractClubInfo(text);
			console.log("Extracted info:", extractedInfo);

			const [club] = await db
				.insert(runningClubs)
				.values({
					...extractedInfo,
					lastUpdated: new Date(extractedInfo.lastUpdated),
				})
				.returning();

			revalidatePath("/clubs");

			return {
				data: club,
				serverError: null,
			};
		} catch (error) {
			console.error("Server action error:", error);
			return {
				data: null,
				serverError:
					error instanceof Error
						? error.message
						: "Failed to process club information",
			};
		}
	});

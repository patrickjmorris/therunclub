"use server";

import { db } from "@/db";
import { runningClubs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { extractClubInfo } from "@/lib/services/openai-service";
import { revalidatePath } from "next/cache";

// Input validation schema
const schema = z.object({
  text: z.string().min(1, "Club information is required"),
});

export async function getFilteredClubs(city: string | null) {
  if (city) {
    return await db
      .select()
      .from(runningClubs)
      .where(eq(runningClubs.city, city))
      .orderBy(desc(runningClubs.lastUpdated));
  }

  return await db
    .select()
    .from(runningClubs)
    .orderBy(desc(runningClubs.lastUpdated));
}

// Action handler for extracting club info
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

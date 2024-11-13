import { db } from "@/db";
import { runningClubs } from "@/db/schema";
import { extractClubInfo } from "@/lib/services/openai-service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const { text } = await request.json();

		if (!text) {
			return NextResponse.json({ error: "Text is required" }, { status: 400 });
		}

		const extractedInfo = await extractClubInfo(text);

		const [club] = await db
			.insert(runningClubs)
			.values({
				...extractedInfo,
				lastUpdated: new Date(extractedInfo.lastUpdated),
			})
			.returning();

		return NextResponse.json({ club });
	} catch (error) {
		console.error("Error extracting club info:", error);
		return NextResponse.json(
			{ error: "Failed to process club information" },
			{ status: 500 },
		);
	}
}

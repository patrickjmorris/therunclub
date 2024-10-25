import { NextRequest, NextResponse } from "next/server";
import { updatePodcastData } from "@/db";

let isUpdating = false;

async function handleUpdate() {
	if (!isUpdating) {
		isUpdating = true;
		try {
			await updatePodcastData();
			return NextResponse.json(
				{ message: "Podcast data updated successfully" },
				{ status: 200 },
			);
		} catch (error) {
			console.error("Error updating podcast data:", error);
			return NextResponse.json(
				{ message: "Error updating podcast data" },
				{ status: 500 },
			);
		} finally {
			isUpdating = false;
		}
	} else {
		return NextResponse.json(
			{ message: "Update already in progress" },
			{ status: 409 },
		);
	}
}

export async function GET(request: NextRequest) {
	return handleUpdate();
}

export async function POST(request: NextRequest) {
	return handleUpdate();
}

import { NextRequest, NextResponse } from "next/server";
import { updatePodcastData } from "@/db";

let isUpdating = false;
const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
let lockTimeout: NodeJS.Timeout;

async function handleUpdate() {
	if (!isUpdating) {
		isUpdating = true;
		clearTimeout(lockTimeout);
		
		// Set a timeout to release the lock in case of unexpected errors
		lockTimeout = setTimeout(() => {
			isUpdating = false;
		}, LOCK_TIMEOUT);

		try {
			const results = await updatePodcastData();
			return NextResponse.json(
				{ 
					message: "Podcast data updated successfully",
					results 
				},
				{ status: 200 }
			);
		} catch (error) {
			console.error("Error updating podcast data:", error);
			return NextResponse.json(
				{ 
					message: "Error updating podcast data",
					error: error instanceof Error ? error.message : "Unknown error"
				},
				{ status: 500 }
			);
		} finally {
			clearTimeout(lockTimeout);
			isUpdating = false;
		}
	} else {
		return NextResponse.json(
			{ message: "Update already in progress" },
			{ status: 409 }
		);
	}
}

export async function GET(request: NextRequest) {
	return handleUpdate();
}

export async function POST(request: NextRequest) {
	return handleUpdate();
}

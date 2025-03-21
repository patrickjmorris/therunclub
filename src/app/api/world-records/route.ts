import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { worldRecords } from "@/db/schema";
import { gqlClient } from "@/lib/world-athletics";
import { eq } from "drizzle-orm";

// Categories for different types of records
const RECORD_CATEGORIES = {
	OUTDOOR: 1,
	INDOOR: 2,
	ROAD: 3,
	JUNIOR: 4,
	YOUTH: 5,
};

interface WorldRecordResponse {
	getRecordsDetailByCategory: Array<{
		gender: string;
		results: Array<{
			competitor: {
				id: string | null;
				name: string;
				teamMembers?: Array<{
					id: string;
					name: string;
				}> | null;
			};
			discipline: string;
			date: string;
			performance: string;
			mixed: boolean;
		}>;
	}>;
}

async function fetchWorldRecords(categoryId: number) {
	const query = `
    query GetRecordsDetailByCategory($categoryId: Int!) {
      getRecordsDetailByCategory(categoryId: $categoryId) {
        gender
        results {
          competitor {
            id
            name
            teamMembers {
              id
              name
            }
          }
          discipline
          date
          performance
          mixed
        }
      }
    }
  `;

	try {
		const response = await gqlClient<WorldRecordResponse>(query, {
			categoryId,
		});
		console.log("API Response:", JSON.stringify(response, null, 2));
		return response;
	} catch (error) {
		console.error(`Error fetching records for category ${categoryId}:`, error);
		throw error;
	}
}

async function updateWorldRecords() {
	try {
		console.log("Starting world records update...");
		let totalRecords = 0;

		// Fetch records for each category
		for (const [categoryName, categoryId] of Object.entries(
			RECORD_CATEGORIES,
		)) {
			console.log(`\nFetching ${categoryName} records...`);
			try {
				const response = await fetchWorldRecords(categoryId);

				// Check if we have a valid response structure
				if (!response?.getRecordsDetailByCategory) {
					console.error(
						`Invalid response structure for ${categoryName}:`,
						response,
					);
					continue;
				}

				// Process each gender category
				for (const genderCategory of response.getRecordsDetailByCategory) {
					const gender = genderCategory.gender === "men" ? "M" : "F";
					const records = genderCategory.results;
					console.log(
						`Found ${records.length} records for ${categoryName} ${gender}`,
					);

					// Process each record
					for (const record of records) {
						const recordId = `${categoryId}-${record.discipline}-${gender}`;

						await db
							.insert(worldRecords)
							.values({
								id: recordId,
								discipline: record.discipline,
								gender,
								performance: record.performance,
								date: record.date,
								competitorId: record.competitor.id || null,
								competitorName: record.competitor.name,
								teamMembers: record.competitor.teamMembers || [],
								mixed: record.mixed,
								lastUpdated: new Date(),
							})
							.onConflictDoUpdate({
								target: worldRecords.id,
								set: {
									performance: record.performance,
									date: record.date,
									competitorId: record.competitor.id || null,
									competitorName: record.competitor.name,
									teamMembers: record.competitor.teamMembers || [],
									mixed: record.mixed,
									lastUpdated: new Date(),
								},
							});

						totalRecords++;
					}
				}

				// Add delay between categories to avoid rate limiting
				await new Promise((resolve) => setTimeout(resolve, 1000));
			} catch (error) {
				console.error(`Error processing category ${categoryName}:`, error);
			}
		}

		console.log(`\n✅ Successfully updated ${totalRecords} world records`);
		return { success: true, message: `Updated ${totalRecords} world records` };
	} catch (error) {
		console.error("❌ Error updating world records:", error);
		return { success: false, message: "Failed to update world records" };
	}
}

export async function GET() {
	try {
		const result = await updateWorldRecords();
		return NextResponse.json(result);
	} catch (error) {
		console.error("Error in world records API:", error);
		return NextResponse.json(
			{ error: "Failed to update world records" },
			{ status: 500 },
		);
	}
}

// Add a POST endpoint for manual updates
export async function POST() {
	try {
		const result = await updateWorldRecords();
		return NextResponse.json(result);
	} catch (error) {
		console.error("Error in world records API:", error);
		return NextResponse.json(
			{ error: "Failed to update world records" },
			{ status: 500 },
		);
	}
}

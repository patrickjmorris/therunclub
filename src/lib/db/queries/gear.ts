import { db } from "@/db/client";
import {
	gear,
	selectGearSchema,
	insertGearSchema,
	NewGear,
	Gear,
} from "@/db/schema";
import {
	eq,
	and,
	or,
	gte,
	lte,
	ilike,
	sql,
	asc,
	desc,
	SQL,
	AnyColumn,
} from "drizzle-orm";

// Function to get a gear item by its ID
export async function getGearById(id: string): Promise<Gear | null> {
	const result = await db.select().from(gear).where(eq(gear.id, id)).limit(1);
	return result[0] || null;
}

// Function to get a gear item by its slug
export async function getGearBySlug(slug: string): Promise<Gear | null> {
	const result = await db
		.select()
		.from(gear)
		.where(eq(gear.slug, slug))
		.limit(1);
	return result[0] || null;
}

// Function to insert a new gear item
export async function insertGear(newGearData: NewGear): Promise<Gear> {
	const result = await db.insert(gear).values(newGearData).returning();
	return result[0];
}

// Function to update an existing gear item (by ID)
export async function updateGear(
	id: string,
	updatedData: Partial<Omit<NewGear, "id" | "slug">>,
): Promise<Gear | null> {
	// Add updatedAt timestamp automatically
	const dataWithTimestamp = { ...updatedData, updatedAt: new Date() };
	const result = await db
		.update(gear)
		.set(dataWithTimestamp)
		.where(eq(gear.id, id))
		.returning();
	return result[0] || null;
}

// Function to query gear items with filtering and pagination
interface QueryGearParams {
	category?: Gear["category"];
	brand?: string;
	minPrice?: number;
	maxPrice?: number;
	sort?: "price_asc" | "price_desc" | "rating_desc" | "newest";
	limit?: number;
	offset?: number;
	searchTerm?: string;
}

export async function queryGear({
	category,
	brand,
	minPrice,
	maxPrice,
	sort = "newest",
	limit = 20,
	offset = 0,
	searchTerm,
}: QueryGearParams): Promise<{ items: Gear[]; totalCount: number }> {
	const conditions = [];
	if (category) conditions.push(eq(gear.category, category));
	if (brand) conditions.push(eq(gear.brand, brand));
	if (minPrice !== undefined)
		conditions.push(gte(gear.price, String(minPrice)));
	if (maxPrice !== undefined)
		conditions.push(lte(gear.price, String(maxPrice)));
	if (searchTerm) {
		conditions.push(
			or(
				ilike(gear.name, `%${searchTerm}%`),
				ilike(gear.description, `%${searchTerm}%`),
			),
		);
	}

	const filterCondition =
		conditions.length > 0 ? and(...conditions) : undefined;

	// Base query
	const baseQuery = db.select().from(gear).where(filterCondition);

	// Total count query
	const totalCountQuery = db
		.select({ count: sql<number>`count(*)` })
		.from(gear)
		.where(filterCondition);

	// Determine order by clause
	let orderByClause: SQL | AnyColumn | undefined;
	switch (sort) {
		case "price_asc":
			orderByClause = asc(gear.price);
			break;
		case "price_desc":
			orderByClause = desc(gear.price);
			break;
		case "rating_desc":
			orderByClause = sql`${gear.rating} DESC NULLS LAST`;
			break;
		case "newest":
			orderByClause = desc(gear.updatedAt);
			break;
	}

	// Apply orderBy, limit, and offset
	const finalQuery = baseQuery
		.orderBy(orderByClause)
		.limit(limit)
		.offset(offset);

	// Execute queries
	const [items, totalResult] = await Promise.all([finalQuery, totalCountQuery]);

	const totalCount = totalResult[0]?.count || 0;

	return { items, totalCount };
}

// --- Task 7: Persistence Layer ---

// Upsert function: Inserts or updates gear based on slug
export async function upsertGear(gearData: NewGear): Promise<Gear> {
	if (!gearData.slug) {
		throw new Error("Slug is required for upsert operation.");
	}

	const existingGear = await getGearBySlug(gearData.slug);

	if (existingGear) {
		// Update existing gear
		console.log(`Updating existing gear: ${gearData.slug}`);
		const { id, slug, ...updateData } = gearData;
		const updated = await updateGear(existingGear.id, updateData);
		if (!updated) {
			throw new Error(`Failed to update gear with slug: ${gearData.slug}`);
		}
		return updated;
	}

	// Insert new gear
	console.log(`Inserting new gear: ${gearData.slug}`);
	const inserted = await insertGear(gearData);
	return inserted;
}

// TODO: Add function to link/unlink gear to athletes (athleteGear table) - Part of Task 12/18

import { z } from "zod";
// We need the actual enum values, not the Drizzle pgEnum object itself
// Assuming gearCategoryEnum.enumValues is the array of strings
import { gearCategoryEnum } from "@/db/schema";
// Import the new enum as well
import { sexAgeEnum } from "@/db/schema";

// Zod schema based on PRD section 5.1
export const gearSchema = z.object({
	name: z.string().min(1, { message: "Name cannot be empty" }),
	brand: z.string().min(1, { message: "Brand cannot be empty" }),
	description: z.string().optional(),
	price: z.number().positive({ message: "Price must be a positive number" }),
	rating: z.number().min(0).max(5).optional(), // Assuming a 0-5 star rating
	reviewCount: z.number().int().nonnegative().optional(),
	link: z.string().url({ message: "Invalid URL format for link" }),
	image: z.string().url({ message: "Invalid URL format for image" }),
	// Use z.enum with the values from the Drizzle enum
	category: z.enum(gearCategoryEnum.enumValues),
	// Add sexAge using the enum values
	sexAge: z.enum(sexAgeEnum.enumValues).optional(), // Make optional initially if needed, or required
});

// Example type inference
export type GearValidationSchema = z.infer<typeof gearSchema>;

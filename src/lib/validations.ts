import { z } from "zod";

export const createListingSchema = z.object({
	title: z.string().min(1).max(200),
	industry: z.string().min(1).max(100),
	country: z.string().min(1).max(100),
	city: z.string().min(1).max(100),
	latitude: z.number().min(-90).max(90),
	longitude: z.number().min(-180).max(180),
	location_precision: z.enum(["city", "approximate", "exact"]).default("approximate"),
	revenue: z.number().min(0),
	profit: z.number(),
	employees: z.number().int().min(0),
	asking_price: z.number().min(0),
});

export const updateListingSchema = createListingSchema.partial();

export const listingFiltersSchema = z.object({
	industry: z.string().optional(),
	min_price: z.coerce.number().optional(),
	max_price: z.coerce.number().optional(),
	min_revenue: z.coerce.number().optional(),
	max_revenue: z.coerce.number().optional(),
	country: z.string().optional(),
	city: z.string().optional(),
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

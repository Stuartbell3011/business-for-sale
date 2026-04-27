export type LocationPrecision = "city" | "approximate" | "exact";

export type Business = {
	id: string;
	title: string;
	industry: string;
	country: string;
	city: string;
	latitude: number;
	longitude: number;
	location_precision: LocationPrecision;
	revenue: number;
	profit: number;
	employees: number;
	asking_price: number;
	verified: boolean;
	source_url?: string | null;
	created_at: string;
	updated_at: string;
	location_metrics?: LocationMetrics[];
};

export type LocationMetrics = {
	business_id: string;
	competition_score: number;
	footfall_score: number;
	demographic_score: number;
	opportunity_score: number;
};

export type ListingFilters = {
	industry?: string;
	min_price?: number;
	max_price?: number;
	min_revenue?: number;
	max_revenue?: number;
	country?: string;
	city?: string;
};

export type PaginationParams = {
	page: number;
	pageSize: number;
};

export type PaginatedResponse<T> = {
	data: T[];
	count: number;
	page: number;
	pageSize: number;
};

export type ApiError = {
	error: string;
	status: number;
};

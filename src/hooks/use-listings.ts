import { useState } from "react";
import type { Business, ListingFilters } from "@/types";

export function useListings(initialFilters: ListingFilters = {}) {
	const [listings, setListings] = useState<Business[]>([]);
	const [filters, setFilters] = useState<ListingFilters>(initialFilters);
	const [loading, setLoading] = useState(false);

	return { listings, filters, setFilters, loading };
}

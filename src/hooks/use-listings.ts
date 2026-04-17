"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Business, ListingFilters } from "@/types";

export function useListings(initialFilters: ListingFilters = {}) {
	const [listings, setListings] = useState<Business[]>([]);
	const [filters, setFilters] = useState<ListingFilters>(initialFilters);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pagination, setPagination] = useState({ page: 1, pageSize: 20, count: 0 });
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

	const fetchListings = useCallback(
		(currentFilters: ListingFilters, page = 1) => {
			if (debounceRef.current) clearTimeout(debounceRef.current);

			debounceRef.current = setTimeout(async () => {
				setLoading(true);
				setError(null);

				const params = new URLSearchParams();
				if (currentFilters.industry) params.set("industry", currentFilters.industry);
				if (currentFilters.min_price) params.set("min_price", String(currentFilters.min_price));
				if (currentFilters.max_price) params.set("max_price", String(currentFilters.max_price));
				if (currentFilters.min_revenue)
					params.set("min_revenue", String(currentFilters.min_revenue));
				if (currentFilters.max_revenue)
					params.set("max_revenue", String(currentFilters.max_revenue));
				if (currentFilters.country) params.set("country", currentFilters.country);
				if (currentFilters.city) params.set("city", currentFilters.city);
				params.set("page", String(page));
				params.set("pageSize", String(pagination.pageSize));

				try {
					const res = await fetch(`/api/listings?${params}`);
					const json = await res.json();

					if (!res.ok) {
						setError(json.error ?? "Failed to fetch listings");
						return;
					}

					setListings(json.data);
					setPagination({ page: json.page, pageSize: json.pageSize, count: json.count });
				} catch {
					setError("Failed to fetch listings");
				} finally {
					setLoading(false);
				}
			}, 300);
		},
		[pagination.pageSize],
	);

	useEffect(() => {
		fetchListings(filters);
	}, [filters, fetchListings]);

	const setPage = (page: number) => {
		fetchListings(filters, page);
	};

	return { listings, filters, setFilters, loading, error, pagination, setPage };
}

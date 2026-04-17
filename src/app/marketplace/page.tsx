"use client";

import { Search } from "lucide-react";
import { ListingGrid } from "@/components/listings/listing-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListings } from "@/hooks/use-listings";

const industries = [
	"All",
	"Cafe",
	"Restaurant",
	"Gym",
	"Salon",
	"Retail",
	"Bar",
	"Services",
	"Tech",
];

export default function MarketplacePage() {
	const { listings, filters, setFilters, loading, pagination, setPage } = useListings();

	return (
		<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight">Businesses for Sale</h1>
				<p className="mt-1 text-muted-foreground">
					{pagination.count} {pagination.count === 1 ? "listing" : "listings"} found
				</p>
			</div>

			{/* Filters */}
			<div className="mb-6 flex flex-wrap items-center gap-3">
				<div className="relative w-full sm:w-64">
					<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search by city..."
						className="pl-9"
						value={filters.city ?? ""}
						onChange={(e) => setFilters({ ...filters, city: e.target.value || undefined })}
					/>
				</div>
				<div className="flex flex-wrap gap-2">
					{industries.map((industry) => (
						<Button
							key={industry}
							variant={
								(industry === "All" && !filters.industry) || filters.industry === industry
									? "default"
									: "outline"
							}
							size="sm"
							className="rounded-full"
							onClick={() =>
								setFilters({
									...filters,
									industry: industry === "All" ? undefined : industry,
								})
							}
						>
							{industry}
						</Button>
					))}
				</div>
			</div>

			{/* Listing grid */}
			<ListingGrid listings={listings} loading={loading} />

			{/* Pagination */}
			{pagination.count > pagination.pageSize && (
				<div className="mt-8 flex items-center justify-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={pagination.page <= 1}
						onClick={() => setPage(pagination.page - 1)}
					>
						Previous
					</Button>
					<span className="text-sm text-muted-foreground">
						Page {pagination.page} of {Math.ceil(pagination.count / pagination.pageSize)}
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={pagination.page >= Math.ceil(pagination.count / pagination.pageSize)}
						onClick={() => setPage(pagination.page + 1)}
					>
						Next
					</Button>
				</div>
			)}
		</div>
	);
}

"use client";

import { List, MapIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { ListingGrid } from "@/components/listings/listing-grid";
import { MapFilters } from "@/components/map/map-filters";
import { Button } from "@/components/ui/button";
import { useListings } from "@/hooks/use-listings";
import { useMap } from "@/hooks/use-map";

const MarketMap = dynamic(() => import("@/components/map/market-map").then((m) => m.MarketMap), {
	ssr: false,
	loading: () => (
		<div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
			Loading map...
		</div>
	),
});

export default function MarketplacePage() {
	const { listings, filters, setFilters, loading, pagination, setPage } = useListings();
	const { selectedBusiness, setSelectedBusiness, view, setView, viewState, setViewState } =
		useMap();

	return (
		<div className="flex h-[calc(100vh-57px)] flex-col">
			{/* Top bar */}
			<div className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
				<div>
					<h1 className="text-lg font-bold">Businesses for Sale</h1>
					<p className="text-xs text-muted-foreground">
						{pagination.count} {pagination.count === 1 ? "listing" : "listings"}
					</p>
				</div>
				<div className="flex gap-1">
					<Button
						variant={view === "map" ? "default" : "outline"}
						size="sm"
						onClick={() => setView("map")}
					>
						<MapIcon className="size-4" />
						<span className="ml-1 hidden sm:inline">Map</span>
					</Button>
					<Button
						variant={view === "list" ? "default" : "outline"}
						size="sm"
						onClick={() => setView("list")}
					>
						<List className="size-4" />
						<span className="ml-1 hidden sm:inline">List</span>
					</Button>
				</div>
			</div>

			{/* Content */}
			<div className="flex flex-1 overflow-hidden">
				{/* Filter sidebar */}
				<aside className="hidden w-72 shrink-0 overflow-y-auto border-r p-4 lg:block">
					<MapFilters filters={filters} onChange={setFilters} />
				</aside>

				{/* Main area */}
				<div className="flex-1 overflow-hidden">
					{view === "map" ? (
						<div className="h-full">
							<MarketMap
								listings={listings}
								selectedBusiness={selectedBusiness}
								onSelectBusiness={setSelectedBusiness}
								viewState={viewState}
								onViewStateChange={setViewState}
							/>
						</div>
					) : (
						<div className="overflow-y-auto p-4">
							<ListingGrid listings={listings} loading={loading} />

							{pagination.count > pagination.pageSize && (
								<div className="mt-6 flex items-center justify-center gap-2">
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
					)}
				</div>
			</div>
		</div>
	);
}

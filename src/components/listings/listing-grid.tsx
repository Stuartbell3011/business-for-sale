import type { Business } from "@/types";
import { ListingCard } from "./listing-card";
import { ListingSkeleton } from "./listing-skeleton";

type Props = {
	listings: Business[];
	loading?: boolean;
};

export function ListingGrid({ listings, loading }: Props) {
	if (loading) {
		return (
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{["s1", "s2", "s3", "s4", "s5", "s6"].map((id) => (
					<ListingSkeleton key={id} />
				))}
			</div>
		);
	}

	if (listings.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center">
				<p className="text-lg font-medium">No listings found</p>
				<p className="mt-1 text-sm text-muted-foreground">
					Try adjusting your filters or check back later.
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{listings.map((listing) => (
				<ListingCard key={listing.id} business={listing} />
			))}
		</div>
	);
}

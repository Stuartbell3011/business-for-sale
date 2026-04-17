import type { Business } from "@/types";
import { ListingCard } from "./listing-card";

type Props = {
	listings: Business[];
};

export function ListingGrid({ listings }: Props) {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{listings.map((listing) => (
				<ListingCard key={listing.id} business={listing} />
			))}
		</div>
	);
}

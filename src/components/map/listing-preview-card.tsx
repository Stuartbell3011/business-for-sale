import { BadgeCheck, MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Business } from "@/types";

type Props = {
	business: Business;
};

export function ListingPreviewCard({ business }: Props) {
	const margin =
		business.revenue > 0 ? ((business.profit / business.revenue) * 100).toFixed(1) : "0";

	return (
		<div className="space-y-2 p-1">
			<div className="flex items-start justify-between gap-2">
				<h3 className="text-sm font-semibold leading-tight">{business.title}</h3>
				{business.verified && <BadgeCheck className="size-3.5 shrink-0 text-primary" />}
			</div>

			<div className="flex items-center gap-1 text-xs text-muted-foreground">
				<MapPin className="size-3" />
				<span>
					{business.city}, {business.country}
				</span>
			</div>

			<span className="inline-block rounded-full bg-secondary px-2 py-0.5 text-xs">
				{business.industry}
			</span>

			<div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
				<div>
					<span className="text-muted-foreground">Asking: </span>
					<span className="font-medium">€{business.asking_price.toLocaleString()}</span>
				</div>
				<div>
					<span className="text-muted-foreground">Revenue: </span>
					<span className="font-medium">€{business.revenue.toLocaleString()}</span>
				</div>
				<div>
					<span className="text-muted-foreground">Profit: </span>
					<span className="font-medium">€{business.profit.toLocaleString()}</span>
				</div>
				<div>
					<span className="text-muted-foreground">Margin: </span>
					<span className="font-medium">{margin}%</span>
				</div>
			</div>

			<Button asChild size="sm" className="w-full">
				<Link href={`/marketplace/listings/${business.id}`}>View Details</Link>
			</Button>
		</div>
	);
}

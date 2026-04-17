import { BadgeCheck, MapPin } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Business } from "@/types";

type Props = {
	business: Business;
};

export function ListingCard({ business }: Props) {
	const margin =
		business.revenue > 0 ? ((business.profit / business.revenue) * 100).toFixed(1) : "0";

	return (
		<Link href={`/marketplace/listings/${business.id}`}>
			<Card className="transition-shadow hover:shadow-md">
				<CardHeader className="pb-2">
					<div className="flex items-start justify-between gap-2">
						<CardTitle className="text-base leading-tight">{business.title}</CardTitle>
						{business.verified && <BadgeCheck className="size-4 shrink-0 text-primary" />}
					</div>
					<div className="flex items-center gap-1 text-sm text-muted-foreground">
						<MapPin className="size-3" />
						<span>
							{business.city}, {business.country}
						</span>
					</div>
				</CardHeader>
				<CardContent>
					<span className="inline-block rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
						{business.industry}
					</span>
					<div className="mt-3 grid grid-cols-2 gap-2 text-sm">
						<div>
							<p className="text-muted-foreground">Asking</p>
							<p className="font-semibold">€{business.asking_price.toLocaleString()}</p>
						</div>
						<div>
							<p className="text-muted-foreground">Revenue</p>
							<p className="font-semibold">€{business.revenue.toLocaleString()}</p>
						</div>
						<div>
							<p className="text-muted-foreground">Profit</p>
							<p className="font-semibold">€{business.profit.toLocaleString()}</p>
						</div>
						<div>
							<p className="text-muted-foreground">Margin</p>
							<p className="font-semibold">{margin}%</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}

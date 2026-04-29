"use client";

import { BadgeCheck, Clock, Edit, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Business } from "@/types";

export default function SellerDashboardPage() {
	const [listings, setListings] = useState<Business[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("/api/listings/mine")
			.then((r) => r.json())
			.then((json) => setListings(json.data ?? []))
			.catch(() => toast.error("Failed to load listings"))
			.finally(() => setLoading(false));
	}, []);

	async function handleDelete(id: string) {
		const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
		if (res.ok) {
			setListings(listings.filter((l) => l.id !== id));
			toast.success("Listing deleted");
		} else {
			toast.error("Failed to delete listing");
		}
	}

	return (
		<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Your Listings</h1>
					<p className="text-sm text-muted-foreground">Manage your business listings</p>
				</div>
				<Button asChild>
					<Link href="/seller/onboard">
						<Plus className="size-4" />
						New Listing
					</Link>
				</Button>
			</div>

			<div className="mt-8 space-y-4">
				{loading &&
					["a", "b", "c"].map((k) => (
						<div key={k} className="h-24 animate-pulse rounded-lg bg-muted" />
					))}

				{!loading && listings.length === 0 && (
					<div className="py-12 text-center">
						<p className="text-lg font-medium">No listings yet</p>
						<p className="mt-1 text-sm text-muted-foreground">
							Create your first listing to get started.
						</p>
						<Button asChild className="mt-4">
							<Link href="/seller/onboard">Create Listing</Link>
						</Button>
					</div>
				)}

				{listings.map((listing) => (
					<Card key={listing.id}>
						<CardHeader className="pb-2">
							<div className="flex items-start justify-between gap-4">
								<div>
									<CardTitle className="text-base">{listing.title}</CardTitle>
									<p className="mt-1 text-sm text-muted-foreground">
										{listing.city}, {listing.country} &middot; {listing.industry}
									</p>
								</div>
								<div className="flex items-center gap-1">
									{listing.verified ? (
										<span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
											<BadgeCheck className="size-3" />
											Verified
										</span>
									) : (
										<span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
											<Clock className="size-3" />
											Pending
										</span>
									)}
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div className="flex items-center justify-between">
								<div className="flex gap-6 text-sm">
									<div>
										<span className="text-muted-foreground">Price: </span>
										<span className="font-medium">€{listing.asking_price.toLocaleString()}</span>
									</div>
									<div>
										<span className="text-muted-foreground">Revenue: </span>
										<span className="font-medium">€{listing.revenue.toLocaleString()}</span>
									</div>
								</div>
								<div className="flex gap-1">
									<Button variant="ghost" size="sm" asChild>
										<Link href={`/marketplace/listings/${listing.id}`}>
											<Edit className="size-4" />
										</Link>
									</Button>
									<Button variant="ghost" size="sm" onClick={() => handleDelete(listing.id)}>
										<Trash2 className="size-4 text-destructive" />
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

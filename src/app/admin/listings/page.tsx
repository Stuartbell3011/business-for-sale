"use client";

import { BadgeCheck, Check, Clock, Search, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Business } from "@/types";

export default function AdminListingsPage() {
	const [listings, setListings] = useState<Business[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");

	useEffect(() => {
		fetch("/api/admin/listings")
			.then((r) => r.json())
			.then((json) => setListings(json.data ?? []))
			.catch(() => toast.error("Failed to load"))
			.finally(() => setLoading(false));
	}, []);

	async function toggleVerified(id: string, verified: boolean) {
		const res = await fetch("/api/admin/listings", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id, verified }),
		});
		if (res.ok) {
			setListings((prev) => prev.map((l) => (l.id === id ? { ...l, verified } : l)));
			toast.success(verified ? "Verified" : "Unverified");
		} else {
			toast.error("Failed to update");
		}
	}

	async function deleteListing(id: string) {
		const res = await fetch("/api/admin/listings", {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id }),
		});
		if (res.ok) {
			setListings((prev) => prev.filter((l) => l.id !== id));
			toast.success("Deleted");
		} else {
			toast.error("Failed to delete");
		}
	}

	async function verifyAll() {
		const unverified = filtered.filter((l) => !l.verified);
		for (const listing of unverified) {
			await toggleVerified(listing.id, true);
		}
		toast.success(`Verified ${unverified.length} listings`);
	}

	const filtered = listings.filter(
		(l) =>
			!search ||
			l.title.toLowerCase().includes(search.toLowerCase()) ||
			l.city.toLowerCase().includes(search.toLowerCase()) ||
			l.industry.toLowerCase().includes(search.toLowerCase()),
	);

	const verifiedCount = filtered.filter((l) => l.verified).length;
	const unverifiedCount = filtered.filter((l) => !l.verified).length;

	return (
		<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Manage Listings</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{filtered.length} listings &middot; {verifiedCount} verified &middot; {unverifiedCount}{" "}
						pending
					</p>
				</div>
				{unverifiedCount > 0 && (
					<Button variant="outline" size="sm" onClick={verifyAll}>
						<Check className="size-4" />
						Verify All ({unverifiedCount})
					</Button>
				)}
			</div>

			{/* Search */}
			<div className="relative mt-6">
				<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Search by title, city, or industry..."
					className="pl-9"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</div>

			{/* List */}
			<div className="mt-6 space-y-2">
				{loading &&
					["a", "b", "c"].map((k) => (
						<div key={k} className="h-20 animate-pulse rounded-lg bg-muted" />
					))}

				{!loading && filtered.length === 0 && (
					<p className="py-8 text-center text-sm text-muted-foreground">No listings found</p>
				)}

				{filtered.map((listing) => (
					<Card key={listing.id}>
						<CardContent className="flex items-center gap-4 py-3">
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<span className="truncate text-sm font-medium">{listing.title}</span>
									{listing.verified ? (
										<BadgeCheck className="size-4 shrink-0 text-green-600" />
									) : (
										<Clock className="size-4 shrink-0 text-amber-500" />
									)}
								</div>
								<div className="mt-1 flex gap-4 text-xs text-muted-foreground">
									<span>{listing.city}</span>
									<span>{listing.industry}</span>
									<span>£{listing.asking_price.toLocaleString()}</span>
									<span>Rev: £{listing.revenue.toLocaleString()}</span>
								</div>
							</div>

							<div className="flex gap-1">
								{listing.verified ? (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => toggleVerified(listing.id, false)}
										title="Unverify"
									>
										<X className="size-4 text-amber-500" />
									</Button>
								) : (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => toggleVerified(listing.id, true)}
										title="Verify"
									>
										<Check className="size-4 text-green-600" />
									</Button>
								)}
								<Button
									variant="ghost"
									size="sm"
									onClick={() => deleteListing(listing.id)}
									title="Delete"
								>
									<Trash2 className="size-4 text-destructive" />
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

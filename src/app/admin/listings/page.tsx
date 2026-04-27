"use client";

import {
	BadgeCheck,
	Building2,
	Check,
	Clock,
	ExternalLink,
	Loader2,
	MapPin,
	Search,
	Star,
	Trash2,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Business } from "@/types";

type EnrichmentReport = {
	business_id: string;
	google: {
		maps_url: string | null;
		rating: number | null;
		review_count: number | null;
		address: string | null;
		phone: string | null;
	};
	companies_house: {
		found: boolean;
		company_number: string | null;
		company_name: string | null;
		status: string | null;
		incorporated: string | null;
		address: string | null;
		sic_codes: string[];
		officers: { name: string; role: string; appointed_on: string }[];
	};
	location: {
		geocoded_from: string | null;
		geocoded_address: string | null;
		latitude: number;
		longitude: number;
		postcode: string | null;
		ward: string | null;
		district: string | null;
		constituency: string | null;
	};
	competition: {
		same_industry_nearby: number;
		total_nearby: number;
	};
};

export default function AdminListingsPage() {
	const [listings, setListings] = useState<Business[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [enriching, setEnriching] = useState<string | null>(null);
	const [reports, setReports] = useState<Record<string, EnrichmentReport>>({});
	const [expandedId, setExpandedId] = useState<string | null>(null);

	async function enrichListing(id: string) {
		setEnriching(id);
		setExpandedId(id);
		try {
			const res = await fetch("/api/admin/enrich", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ business_id: id }),
			});
			const json = await res.json();
			if (res.ok) {
				setReports((prev) => ({ ...prev, [id]: json.data }));
				toast.success("Research complete");
			} else {
				toast.error(json.error ?? "Enrichment failed");
			}
		} catch {
			toast.error("Failed to enrich");
		} finally {
			setEnriching(null);
		}
	}

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
									{listing.source_url && (
										<a
											href={listing.source_url}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-0.5 text-primary hover:underline"
										>
											Source <ExternalLink className="size-3" />
										</a>
									)}
								</div>
							</div>

							<div className="flex gap-1">
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										reports[listing.id]
											? setExpandedId(expandedId === listing.id ? null : listing.id)
											: enrichListing(listing.id)
									}
									disabled={enriching === listing.id}
								>
									{enriching === listing.id ? (
										<Loader2 className="size-4 animate-spin" />
									) : (
										<Search className="size-4" />
									)}
									Research
								</Button>
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

						{/* Enrichment report */}
						{expandedId === listing.id && reports[listing.id] && (
							<div className="border-t bg-muted/30 px-6 py-4 text-xs">
								{(() => {
									const r = reports[listing.id];
									return (
										<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
											{/* Google */}
											<div className="space-y-1">
												<p className="font-semibold flex items-center gap-1">
													<Star className="size-3" /> Google
												</p>
												{r.google.rating && (
													<p>
														Rating: {r.google.rating} ({r.google.review_count} reviews)
													</p>
												)}
												{r.google.address && <p>Address: {r.google.address}</p>}
												{r.google.phone && <p>Phone: {r.google.phone}</p>}
												{r.google.maps_url && (
													<a
														href={r.google.maps_url}
														target="_blank"
														rel="noopener noreferrer"
														className="inline-flex items-center gap-1 text-primary hover:underline"
													>
														Google Maps <ExternalLink className="size-3" />
													</a>
												)}
												{!r.google.rating && !r.google.address && (
													<p className="text-muted-foreground">No data found</p>
												)}
											</div>

											{/* Companies House */}
											<div className="space-y-1">
												<p className="font-semibold flex items-center gap-1">
													<Building2 className="size-3" /> Companies House
												</p>
												{r.companies_house.found ? (
													<>
														<p>{r.companies_house.company_name}</p>
														<p>Status: {r.companies_house.status}</p>
														<p>Since: {r.companies_house.incorporated}</p>
														{r.companies_house.address && <p>{r.companies_house.address}</p>}
														{r.companies_house.officers.length > 0 && (
															<p>
																Directors:{" "}
																{r.companies_house.officers.map((o) => o.name).join(", ")}
															</p>
														)}
														{r.companies_house.company_number && (
															<a
																href={`https://find-and-update.company-information.service.gov.uk/company/${r.companies_house.company_number}`}
																target="_blank"
																rel="noopener noreferrer"
																className="inline-flex items-center gap-1 text-primary hover:underline"
															>
																View filing <ExternalLink className="size-3" />
															</a>
														)}
													</>
												) : (
													<p className="text-muted-foreground">
														No match found (may be sole trader)
													</p>
												)}
											</div>

											{/* Location */}
											<div className="space-y-1">
												<p className="font-semibold flex items-center gap-1">
													<MapPin className="size-3" /> Location
												</p>
												{r.location.geocoded_from && (
													<p className="text-green-600">Geocoded: {r.location.geocoded_from}</p>
												)}
												{r.location.geocoded_address && (
													<p className="truncate" title={r.location.geocoded_address}>
														{r.location.geocoded_address}
													</p>
												)}
												{r.location.postcode && <p>Postcode: {r.location.postcode}</p>}
												{r.location.ward && <p>Ward: {r.location.ward}</p>}
												{r.location.district && <p>District: {r.location.district}</p>}
												{r.location.constituency && <p>Constituency: {r.location.constituency}</p>}
												<p className="text-muted-foreground">
													{r.location.latitude.toFixed(4)}, {r.location.longitude.toFixed(4)}
												</p>
											</div>

											{/* Competition */}
											<div className="space-y-1">
												<p className="font-semibold">Competition (2km)</p>
												<p>Same industry: {r.competition.same_industry_nearby}</p>
												<p>Total businesses: {r.competition.total_nearby}</p>
											</div>
										</div>
									);
								})()}
							</div>
						)}
					</Card>
				))}
			</div>
		</div>
	);
}

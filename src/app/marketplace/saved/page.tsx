"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ListingGrid } from "@/components/listings/listing-grid";
import { createClient } from "@/lib/supabase/client";
import type { Business } from "@/types";

export default function SavedListingsPage() {
	const [listings, setListings] = useState<Business[]>([]);
	const [loading, setLoading] = useState(true);
	const supabase = useMemo(() => createClient(), []);

	useEffect(() => {
		async function load() {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) {
				setLoading(false);
				return;
			}

			const { data: favs } = await supabase
				.from("favorites")
				.select("business_id")
				.eq("user_id", user.id);

			if (!favs || favs.length === 0) {
				setLoading(false);
				return;
			}

			const ids = favs.map((f) => f.business_id);
			const { data: businesses } = await supabase
				.from("businesses")
				.select("*, location_metrics(*)")
				.in("id", ids)
				.is("deleted_at", null);

			setListings(businesses ?? []);
			setLoading(false);
		}

		load().catch(() => {
			toast.error("Failed to load saved listings");
			setLoading(false);
		});
	}, [supabase]);

	return (
		<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<h1 className="mb-8 text-2xl font-bold">Saved Listings</h1>
			<ListingGrid listings={listings} loading={loading} />
		</div>
	);
}

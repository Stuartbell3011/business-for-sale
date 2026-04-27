"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useFavorites() {
	const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
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

			const { data } = await supabase
				.from("favorites")
				.select("business_id")
				.eq("user_id", user.id);

			if (data) {
				setFavoriteIds(new Set(data.map((f) => f.business_id)));
			}
			setLoading(false);
		}
		load();
	}, [supabase]);

	const toggle = useCallback(
		async (businessId: string) => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return;

			if (favoriteIds.has(businessId)) {
				await supabase
					.from("favorites")
					.delete()
					.eq("user_id", user.id)
					.eq("business_id", businessId);
				setFavoriteIds((prev) => {
					const next = new Set(prev);
					next.delete(businessId);
					return next;
				});
			} else {
				await supabase.from("favorites").insert({
					user_id: user.id,
					business_id: businessId,
				});
				setFavoriteIds((prev) => new Set(prev).add(businessId));
			}
		},
		[supabase, favoriteIds],
	);

	const isFavorite = useCallback(
		(businessId: string) => favoriteIds.has(businessId),
		[favoriteIds],
	);

	return { favoriteIds, isFavorite, toggle, loading };
}

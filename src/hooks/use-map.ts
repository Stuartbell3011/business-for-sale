"use client";

import { useCallback, useState } from "react";
import { DEFAULT_MAP_CONFIG } from "@/lib/map/mapbox";
import type { Business } from "@/types";

type ViewState = {
	longitude: number;
	latitude: number;
	zoom: number;
};

export function useMap() {
	const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
	const [view, setView] = useState<"map" | "list">("map");
	const [viewState, setViewState] = useState<ViewState>({
		longitude: DEFAULT_MAP_CONFIG.center[0],
		latitude: DEFAULT_MAP_CONFIG.center[1],
		zoom: DEFAULT_MAP_CONFIG.zoom,
	});

	const flyTo = useCallback((lng: number, lat: number, zoom = 14) => {
		setViewState({ longitude: lng, latitude: lat, zoom });
	}, []);

	return {
		selectedBusiness,
		setSelectedBusiness,
		view,
		setView,
		viewState,
		setViewState,
		flyTo,
	};
}

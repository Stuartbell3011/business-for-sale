"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useRef } from "react";
import MapGL, { Layer, type MapRef, Popup, Source } from "react-map-gl";
import { DEFAULT_MAP_CONFIG, MAPBOX_TOKEN } from "@/lib/map/mapbox";
import type { Business } from "@/types";
import { ListingPreviewCard } from "./listing-preview-card";

type ViewState = {
	longitude: number;
	latitude: number;
	zoom: number;
};

type Props = {
	listings: Business[];
	selectedBusiness: Business | null;
	onSelectBusiness: (business: Business | null) => void;
	viewState: ViewState;
	onViewStateChange: (vs: ViewState) => void;
};

function toGeoJSON(listings: Business[]) {
	return {
		type: "FeatureCollection" as const,
		features: listings.map((b) => ({
			type: "Feature" as const,
			geometry: {
				type: "Point" as const,
				coordinates: [b.longitude, b.latitude],
			},
			properties: {
				id: b.id,
				title: b.title,
				asking_price: b.asking_price,
				revenue: b.revenue,
				profit: b.profit,
				industry: b.industry,
				city: b.city,
				country: b.country,
				verified: b.verified,
				employees: b.employees,
				location_precision: b.location_precision,
				created_at: b.created_at,
				updated_at: b.updated_at,
			},
		})),
	};
}

export function MarketMap({
	listings,
	selectedBusiness,
	onSelectBusiness,
	viewState,
	onViewStateChange,
}: Props) {
	const mapRef = useRef<MapRef>(null);

	const handleClick = useCallback(
		(e: mapboxgl.MapLayerMouseEvent) => {
			const feature = e.features?.[0];
			if (!feature) {
				onSelectBusiness(null);
				return;
			}

			// Cluster click — zoom in
			if (feature.properties?.cluster) {
				const clusterId = feature.properties.cluster_id;
				const source = mapRef.current?.getSource("listings") as mapboxgl.GeoJSONSource;
				source?.getClusterExpansionZoom(
					clusterId,
					(err: unknown, zoom: number | null | undefined) => {
						if (err || zoom == null || !feature.geometry || feature.geometry.type !== "Point")
							return;
						mapRef.current?.flyTo({
							center: feature.geometry.coordinates as [number, number],
							zoom,
						});
					},
				);
				return;
			}

			// Single point click
			const props = feature.properties;
			if (props?.id) {
				const business = listings.find((l) => l.id === props.id);
				if (business) onSelectBusiness(business);
			}
		},
		[listings, onSelectBusiness],
	);

	if (!MAPBOX_TOKEN) {
		return (
			<div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
				Set NEXT_PUBLIC_MAPBOX_TOKEN to enable the map
			</div>
		);
	}

	return (
		<MapGL
			ref={mapRef}
			{...viewState}
			onMove={(e) => onViewStateChange(e.viewState)}
			mapStyle={DEFAULT_MAP_CONFIG.style}
			mapboxAccessToken={MAPBOX_TOKEN}
			onClick={handleClick}
			interactiveLayerIds={["clusters", "unclustered-point"]}
			style={{ width: "100%", height: "100%" }}
		>
			<Source
				id="listings"
				type="geojson"
				data={toGeoJSON(listings)}
				cluster
				clusterMaxZoom={14}
				clusterRadius={50}
			>
				{/* Cluster circles */}
				<Layer
					id="clusters"
					type="circle"
					filter={["has", "point_count"]}
					paint={{
						"circle-color": [
							"step",
							["get", "point_count"],
							"#51bbd6",
							10,
							"#f1f075",
							30,
							"#f28cb1",
						],
						"circle-radius": ["step", ["get", "point_count"], 20, 10, 30, 30, 40],
					}}
				/>

				{/* Cluster count labels */}
				<Layer
					id="cluster-count"
					type="symbol"
					filter={["has", "point_count"]}
					layout={{
						"text-field": "{point_count_abbreviated}",
						"text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
						"text-size": 12,
					}}
				/>

				{/* Individual markers */}
				<Layer
					id="unclustered-point"
					type="circle"
					filter={["!", ["has", "point_count"]]}
					paint={{
						"circle-color": "#1a1a1a",
						"circle-radius": 8,
						"circle-stroke-width": 2,
						"circle-stroke-color": "#fff",
					}}
				/>
			</Source>

			{/* Preview popup */}
			{selectedBusiness && (
				<Popup
					longitude={selectedBusiness.longitude}
					latitude={selectedBusiness.latitude}
					anchor="bottom"
					onClose={() => onSelectBusiness(null)}
					closeOnClick={false}
					maxWidth="320px"
				>
					<ListingPreviewCard business={selectedBusiness} />
				</Popup>
			)}
		</MapGL>
	);
}

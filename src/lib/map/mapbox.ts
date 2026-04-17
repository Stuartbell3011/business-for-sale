export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export const DEFAULT_MAP_CONFIG = {
	style: "mapbox://styles/mapbox/light-v11",
	center: [-0.118, 51.509] as [number, number], // London
	zoom: 11,
};

/**
 * Postcodes.io + Nominatim (OpenStreetMap) — both free, no API key required
 * https://postcodes.io/
 * https://nominatim.org/
 */

export type PostcodeData = {
	postcode: string;
	latitude: number;
	longitude: number;
	admin_ward: string;
	parliamentary_constituency: string;
	admin_district: string;
	region: string;
	country: string;
	outcode: string;
};

export async function lookupPostcode(postcode: string): Promise<PostcodeData | null> {
	try {
		const cleaned = postcode.replace(/\s+/g, "").toUpperCase();
		const res = await fetch(`https://api.postcodes.io/postcodes/${cleaned}`);

		if (!res.ok) return null;

		const data = await res.json();
		if (data.status !== 200 || !data.result) return null;

		const r = data.result;
		return {
			postcode: r.postcode,
			latitude: r.latitude,
			longitude: r.longitude,
			admin_ward: r.admin_ward,
			parliamentary_constituency: r.parliamentary_constituency,
			admin_district: r.admin_district,
			region: r.region,
			country: r.country,
			outcode: r.outcode,
		};
	} catch {
		return null;
	}
}

export async function reverseGeocode(lat: number, lng: number): Promise<PostcodeData | null> {
	try {
		const res = await fetch(
			`https://api.postcodes.io/postcodes?lon=${lng}&lat=${lat}&radius=500&limit=1`,
		);

		if (!res.ok) return null;

		const data = await res.json();
		if (data.status !== 200 || !data.result?.[0]) return null;

		const r = data.result[0];
		return {
			postcode: r.postcode,
			latitude: r.latitude,
			longitude: r.longitude,
			admin_ward: r.admin_ward,
			parliamentary_constituency: r.parliamentary_constituency,
			admin_district: r.admin_district,
			region: r.region,
			country: r.country,
			outcode: r.outcode,
		};
	} catch {
		return null;
	}
}

export async function getNearbyPostcodes(
	lat: number,
	lng: number,
	radius = 500,
): Promise<PostcodeData[]> {
	try {
		const res = await fetch(
			`https://api.postcodes.io/postcodes?lon=${lng}&lat=${lat}&radius=${radius}&limit=10`,
		);

		if (!res.ok) return [];

		const data = await res.json();
		return (data.result ?? []).map((r: Record<string, unknown>) => ({
			postcode: r.postcode,
			latitude: r.latitude,
			longitude: r.longitude,
			admin_ward: r.admin_ward,
			parliamentary_constituency: r.parliamentary_constituency,
			admin_district: r.admin_district,
			region: r.region,
			country: r.country,
			outcode: r.outcode,
		}));
	} catch {
		return [];
	}
}

/**
 * Geocode a place name to lat/lng using Nominatim (OpenStreetMap).
 * Free, no API key. Rate limit: 1 req/sec.
 */
export async function geocodePlaceName(
	query: string,
): Promise<{ lat: number; lng: number; display_name: string } | null> {
	try {
		const res = await fetch(
			`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=gb`,
			{
				headers: {
					"User-Agent": "NextOwner/1.0 (business listing platform)",
				},
			},
		);

		if (!res.ok) return null;

		const data = await res.json();
		if (!data[0]) return null;

		return {
			lat: parseFloat(data[0].lat),
			lng: parseFloat(data[0].lon),
			display_name: data[0].display_name,
		};
	} catch {
		return null;
	}
}

/**
 * Extract a location hint from a business listing title.
 * e.g. "Fully-fitted Café And Restaurant In Camberwell, South London" → "Camberwell, London"
 */
export function extractLocationFromTitle(title: string): string | null {
	// Pattern: "... in [Location]" or "... In [Location]"
	const inMatch = title.match(/\b[Ii]n\s+([A-Za-z][a-zA-Z\s,'-]+)/);
	if (inMatch) return inMatch[1].trim();

	// Pattern: "... [Location] - ..."
	const dashMatch = title.match(/[-–]\s*([A-Z][a-zA-Z\s,'-]+)/);
	if (dashMatch) return dashMatch[1].trim();

	return null;
}

/**
 * Postcodes.io — free, no API key required
 * https://postcodes.io/
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
		const res = await fetch(`https://api.postcodes.io/postcodes?lon=${lng}&lat=${lat}&limit=1`);

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

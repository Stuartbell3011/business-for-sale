import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { matchBusiness } from "@/lib/enrichment/business-matcher";
import { getOfficers } from "@/lib/enrichment/companies-house";
import { findGoogleBusiness } from "@/lib/enrichment/google-search";
import {
	extractLocationFromTitle,
	geocodePlaceName,
	lookupPostcode,
	reverseGeocode,
} from "@/lib/enrichment/postcodes";

function getAdmin() {
	return createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
		process.env.SUPABASE_SERVICE_ROLE_KEY || (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""),
	);
}

export async function POST(request: NextRequest) {
	try {
		const { business_id } = await request.json();

		if (!business_id) {
			return NextResponse.json({ error: "business_id required" }, { status: 400 });
		}

		const supabase = getAdmin();

		const { data: business, error } = await supabase
			.from("businesses")
			.select("*")
			.eq("id", business_id)
			.single();

		if (error || !business) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		// Geocode location from title
		const locationHint = extractLocationFromTitle(business.title);
		let geocoded: { lat: number; lng: number; display_name: string } | null = null;

		if (locationHint) {
			geocoded = await geocodePlaceName(`${locationHint}, London, UK`);
		}

		const lat = geocoded?.lat ?? business.latitude;
		const lng = geocoded?.lng ?? business.longitude;

		// Run enrichments in parallel with error isolation
		const [googleInfo, companies, postcodeData] = await Promise.all([
			findGoogleBusiness(business.title, locationHint ?? business.city).catch(() => ({
				maps_url: null,
				rating: null,
				review_count: null,
				address: null,
				phone: null,
			})),
			// AI business matcher — searches Companies House with smart queries
			matchBusiness({
				title: business.title,
				industry: business.industry,
				city: business.city,
				revenue: business.revenue,
				profit: business.profit,
				asking_price: business.asking_price,
			}).catch(() => ({
				confidence: "none" as const,
				company_number: null,
				company_name: null,
				address: null,
				postcode: null,
				status: null,
				incorporated: null,
				sic_codes: [],
				reasoning: "Matcher failed",
			})),
			reverseGeocode(lat, lng).catch(() => null),
		]);

		// If AI matched a company, get officers + use postcode for precise location
		let officers: { name: string; role: string; appointed_on: string }[] = [];
		const matched = companies;

		if (matched.company_number) {
			officers = await getOfficers(matched.company_number).catch(() => []);
		}

		// If we got a postcode from Companies House, geocode it for precise lat/lng
		if (matched.postcode) {
			const postcodeLocation = await lookupPostcode(matched.postcode);
			if (postcodeLocation) {
				geocoded = {
					lat: postcodeLocation.latitude,
					lng: postcodeLocation.longitude,
					display_name: `${matched.address} (from Companies House)`,
				};
			}
		}

		// Update listing with best available location
		const finalLat = geocoded?.lat ?? lat;
		const finalLng = geocoded?.lng ?? lng;
		const updates: Record<string, unknown> = {};

		if (finalLat !== business.latitude || finalLng !== business.longitude) {
			updates.latitude = finalLat;
			updates.longitude = finalLng;
		}
		if (locationHint && !matched.postcode) {
			updates.city = locationHint;
		}
		if (matched.address) {
			updates.city = matched.address;
		}
		if (Object.keys(updates).length > 0) {
			updates.updated_at = new Date().toISOString();
			await supabase.from("businesses").update(updates).eq("id", business_id);
		}

		return NextResponse.json({
			data: {
				business_id,
				google: googleInfo,
				companies_house: {
					found: matched.confidence !== "none",
					confidence: matched.confidence,
					company_number: matched.company_number,
					company_name: matched.company_name,
					status: matched.status,
					incorporated: matched.incorporated,
					address: matched.address,
					sic_codes: matched.sic_codes,
					officers,
					reasoning: matched.reasoning,
				},
				location: {
					geocoded_from: matched.postcode
						? `Companies House: ${matched.postcode}`
						: (locationHint ?? null),
					geocoded_address: geocoded?.display_name ?? null,
					latitude: finalLat,
					longitude: finalLng,
					postcode: matched.postcode ?? postcodeData?.postcode ?? null,
					ward: postcodeData?.admin_ward ?? null,
					district: postcodeData?.admin_district ?? null,
					constituency: postcodeData?.parliamentary_constituency ?? null,
				},
				competition: {
					same_industry_nearby: 0,
					total_nearby: 0,
				},
			},
		});
	} catch (err) {
		console.error("Enrich error:", err);
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Enrichment failed" },
			{ status: 500 },
		);
	}
}

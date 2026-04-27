import { type NextRequest, NextResponse } from "next/server";
import { searchCompany, getCompanyProfile, getOfficers } from "@/lib/enrichment/companies-house";
import { findGoogleBusiness } from "@/lib/enrichment/google-search";
import { extractLocationFromTitle, geocodePlaceName, reverseGeocode } from "@/lib/enrichment/postcodes";
import { createClient } from "@supabase/supabase-js";

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
			searchCompany(business.title).catch(() => []),
			reverseGeocode(lat, lng).catch(() => null),
		]);

		// Companies House detail
		let companyProfile = null;
		let officers: { name: string; role: string; appointed_on: string }[] = [];
		const bestMatch = companies[0];

		if (bestMatch) {
			[companyProfile, officers] = await Promise.all([
				getCompanyProfile(bestMatch.company_number).catch(() => null),
				getOfficers(bestMatch.company_number).catch(() => []),
			]);
		}

		// Update listing with better location
		const updates: Record<string, unknown> = {};
		if (geocoded) {
			updates.latitude = geocoded.lat;
			updates.longitude = geocoded.lng;
			if (locationHint) updates.city = locationHint;
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
					found: !!bestMatch,
					company_number: bestMatch?.company_number ?? null,
					company_name: bestMatch?.title ?? null,
					status: companyProfile?.company_status ?? bestMatch?.company_status ?? null,
					incorporated: companyProfile?.date_of_creation ?? bestMatch?.date_of_creation ?? null,
					address: companyProfile?.registered_office_address
						? [
								companyProfile.registered_office_address.address_line_1,
								companyProfile.registered_office_address.address_line_2,
								companyProfile.registered_office_address.locality,
								companyProfile.registered_office_address.postal_code,
							]
								.filter(Boolean)
								.join(", ")
						: (bestMatch?.address_snippet ?? null),
					sic_codes: companyProfile?.sic_codes ?? [],
					officers,
				},
				location: {
					geocoded_from: locationHint ?? null,
					geocoded_address: geocoded?.display_name ?? null,
					latitude: lat,
					longitude: lng,
					postcode: postcodeData?.postcode ?? null,
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

import { type NextRequest, NextResponse } from "next/server";
import { getCompanyProfile, getOfficers, searchCompany } from "@/lib/enrichment/companies-house";
import { findGoogleBusiness } from "@/lib/enrichment/google-search";
import { reverseGeocode } from "@/lib/enrichment/postcodes";
import { adminSupabase } from "@/lib/supabase/admin";

export type EnrichmentReport = {
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

export async function POST(request: NextRequest) {
	const { business_id } = await request.json();

	if (!business_id) {
		return NextResponse.json({ error: "business_id required" }, { status: 400 });
	}

	// Get the business
	const { data: business, error } = await adminSupabase
		.from("businesses")
		.select("*")
		.eq("id", business_id)
		.single();

	if (error || !business) {
		return NextResponse.json({ error: "Business not found" }, { status: 404 });
	}

	// Run all enrichments in parallel
	const [googleInfo, companies, postcodeData, nearbyData] = await Promise.all([
		// Google search for reviews + Maps link
		findGoogleBusiness(business.title, business.city),

		// Companies House search
		searchCompany(business.title),

		// Reverse geocode for area data
		reverseGeocode(business.latitude, business.longitude),

		// Nearby competition from our own data
		adminSupabase.rpc("get_nearby_counts", {
			target_lat: business.latitude,
			target_lng: business.longitude,
			target_industry: business.industry,
			target_id: business.id,
			radius_meters: 2000,
		}),
	]);

	// Get company profile if we found a match
	let companyProfile = null;
	let officers: { name: string; role: string; appointed_on: string }[] = [];
	const bestMatch = companies[0];

	if (bestMatch) {
		const [profile, officerList] = await Promise.all([
			getCompanyProfile(bestMatch.company_number),
			getOfficers(bestMatch.company_number),
		]);
		companyProfile = profile;
		officers = officerList;
	}

	// Update business with enriched data if we found better info
	const updates: Record<string, unknown> = {};

	if (postcodeData && postcodeData.latitude && postcodeData.longitude) {
		// We got a more precise location from postcode
		updates.latitude = postcodeData.latitude;
		updates.longitude = postcodeData.longitude;
	}

	if (companyProfile?.registered_office_address?.postal_code) {
		// We have a real postcode from Companies House
		updates.city = [
			companyProfile.registered_office_address.locality,
			companyProfile.registered_office_address.address_line_1,
		]
			.filter(Boolean)
			.join(", ");
	}

	if (Object.keys(updates).length > 0) {
		updates.updated_at = new Date().toISOString();
		await adminSupabase.from("businesses").update(updates).eq("id", business_id);
	}

	const report: EnrichmentReport = {
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
			postcode: postcodeData?.postcode ?? null,
			ward: postcodeData?.admin_ward ?? null,
			district: postcodeData?.admin_district ?? null,
			constituency: postcodeData?.parliamentary_constituency ?? null,
		},
		competition: {
			same_industry_nearby: nearbyData.data?.[0]?.same_industry ?? 0,
			total_nearby: nearbyData.data?.[0]?.total_nearby ?? 0,
		},
	};

	return NextResponse.json({ data: report });
}

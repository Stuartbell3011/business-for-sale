import { type NextRequest, NextResponse } from "next/server";
import {
	computeCompetitionScore,
	computeFootfallProxy,
	computeOpportunityScore,
} from "@/lib/scoring";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
	const businessId = request.nextUrl.searchParams.get("business_id");

	if (!businessId) {
		return NextResponse.json({ error: "business_id is required" }, { status: 400 });
	}

	const supabase = await createClient();

	// Get target business
	const { data: business, error: bizError } = await supabase
		.from("businesses")
		.select("id, latitude, longitude, industry")
		.eq("id", businessId)
		.single();

	if (bizError || !business) {
		return NextResponse.json({ error: "Business not found" }, { status: 404 });
	}

	// Query nearby businesses within 2km using earthdistance
	const { data: nearby } = await supabase.rpc("get_nearby_counts", {
		target_lat: business.latitude,
		target_lng: business.longitude,
		target_industry: business.industry,
		target_id: business.id,
		radius_meters: 2000,
	});

	const sameIndustry = nearby?.[0]?.same_industry ?? 0;
	const totalNearby = nearby?.[0]?.total_nearby ?? 0;

	const competition = computeCompetitionScore(sameIndustry);
	const footfall = computeFootfallProxy(totalNearby);
	const opportunity = computeOpportunityScore(competition, footfall);

	// Upsert location metrics
	const { error: upsertError } = await supabase.from("location_metrics").upsert(
		{
			business_id: businessId,
			competition_score: competition,
			footfall_score: footfall,
			demographic_score: 0,
			opportunity_score: opportunity,
			computed_at: new Date().toISOString(),
		},
		{ onConflict: "business_id" },
	);

	if (upsertError) {
		return NextResponse.json({ error: upsertError.message }, { status: 500 });
	}

	return NextResponse.json({
		data: {
			business_id: businessId,
			competition_score: competition,
			footfall_score: footfall,
			demographic_score: 0,
			opportunity_score: opportunity,
			nearby: { same_industry: sameIndustry, total: totalNearby },
		},
	});
}

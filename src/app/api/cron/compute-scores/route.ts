import { type NextRequest, NextResponse } from "next/server";
import {
	computeCompetitionScore,
	computeFootfallProxy,
	computeOpportunityScore,
} from "@/lib/scoring";
import { adminSupabase } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
	// Protect with a secret header
	const authHeader = request.headers.get("authorization");
	const cronSecret = process.env.CRON_SECRET;

	if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { data: businesses, error } = await adminSupabase
		.from("businesses")
		.select("id, latitude, longitude, industry")
		.eq("verified", true)
		.is("deleted_at", null);

	if (error || !businesses) {
		return NextResponse.json({ error: error?.message ?? "No businesses" }, { status: 500 });
	}

	let updated = 0;

	for (const biz of businesses) {
		const { data: nearby } = await adminSupabase.rpc("get_nearby_counts", {
			target_lat: biz.latitude,
			target_lng: biz.longitude,
			target_industry: biz.industry,
			target_id: biz.id,
			radius_meters: 2000,
		});

		const sameIndustry = nearby?.[0]?.same_industry ?? 0;
		const totalNearby = nearby?.[0]?.total_nearby ?? 0;

		const competition = computeCompetitionScore(sameIndustry);
		const footfall = computeFootfallProxy(totalNearby);
		const opportunity = computeOpportunityScore(competition, footfall);

		await adminSupabase.from("location_metrics").upsert(
			{
				business_id: biz.id,
				competition_score: competition,
				footfall_score: footfall,
				demographic_score: 0,
				opportunity_score: opportunity,
				computed_at: new Date().toISOString(),
			},
			{ onConflict: "business_id" },
		);

		updated++;
	}

	return NextResponse.json({ updated, total: businesses.length });
}

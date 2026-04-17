import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createListingSchema, listingFiltersSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const params = Object.fromEntries(searchParams.entries());
	const parsed = listingFiltersSchema.safeParse(params);

	if (!parsed.success) {
		return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
	}

	const {
		industry,
		min_price,
		max_price,
		min_revenue,
		max_revenue,
		country,
		city,
		page,
		pageSize,
	} = parsed.data;

	const supabase = await createClient();
	let query = supabase
		.from("businesses")
		.select("*, location_metrics(*)", { count: "exact" })
		.is("deleted_at", null);

	if (industry) query = query.eq("industry", industry);
	if (min_price) query = query.gte("asking_price", min_price);
	if (max_price) query = query.lte("asking_price", max_price);
	if (min_revenue) query = query.gte("revenue", min_revenue);
	if (max_revenue) query = query.lte("revenue", max_revenue);
	if (country) query = query.ilike("country", country);
	if (city) query = query.ilike("city", `%${city}%`);

	const from = (page - 1) * pageSize;
	const to = from + pageSize - 1;

	const { data, error, count } = await query
		.order("created_at", { ascending: false })
		.range(from, to);

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({
		data: data ?? [],
		count: count ?? 0,
		page,
		pageSize,
	});
}

export async function POST(request: NextRequest) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await request.json();
	const parsed = createListingSchema.safeParse(body);

	if (!parsed.success) {
		return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
	}

	const { data, error } = await supabase
		.from("businesses")
		.insert({ ...parsed.data, owner_id: user.id, verified: false })
		.select()
		.single();

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ data }, { status: 201 });
}

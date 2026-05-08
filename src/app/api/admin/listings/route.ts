import { type NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase/admin";

export async function GET() {
	const { data, error } = await adminSupabase
		.from("businesses")
		.select("*")
		.is("deleted_at", null)
		.order("created_at", { ascending: false });

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest) {
	const { id, verified } = await request.json();

	if (!id || typeof verified !== "boolean") {
		return NextResponse.json({ error: "id and verified required" }, { status: 400 });
	}

	const { error } = await adminSupabase
		.from("businesses")
		.update({ verified, updated_at: new Date().toISOString() })
		.eq("id", id);

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
	const { id } = await request.json();

	if (!id) {
		return NextResponse.json({ error: "id required" }, { status: 400 });
	}

	const { error } = await adminSupabase
		.from("businesses")
		.update({ deleted_at: new Date().toISOString() })
		.eq("id", id);

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ success: true });
}

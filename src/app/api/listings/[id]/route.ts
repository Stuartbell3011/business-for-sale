import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateListingSchema } from "@/lib/validations";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("businesses")
		.select("*, location_metrics(*)")
		.eq("id", id)
		.is("deleted_at", null)
		.single();

	if (error || !data) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	return NextResponse.json({ data });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await request.json();
	const parsed = updateListingSchema.safeParse(body);

	if (!parsed.success) {
		return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
	}

	const { data, error } = await supabase
		.from("businesses")
		.update({ ...parsed.data, updated_at: new Date().toISOString() })
		.eq("id", id)
		.eq("owner_id", user.id)
		.select()
		.single();

	if (error || !data) {
		return NextResponse.json({ error: "Not found or not authorized" }, { status: 403 });
	}

	return NextResponse.json({ data });
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { error } = await supabase
		.from("businesses")
		.update({ deleted_at: new Date().toISOString() })
		.eq("id", id)
		.eq("owner_id", user.id);

	if (error) {
		return NextResponse.json({ error: "Not found or not authorized" }, { status: 403 });
	}

	return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ listings: [] });
}

export async function POST() {
  return NextResponse.json({ listing: null }, { status: 501 });
}

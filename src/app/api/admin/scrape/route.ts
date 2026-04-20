import { type NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/ai/openai";
import { createClient } from "@/lib/supabase/server";

const EXTRACT_PROMPT = `You are a data extraction specialist. Given the HTML content of a business-for-sale listing page, extract structured data.

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "title": "short descriptive listing title",
  "industry": "one of: Cafe, Restaurant, Gym, Salon, Retail, Bar, Services, Tech, Other",
  "city": "city name (default to London if unclear)",
  "country": "country (default to United Kingdom)",
  "revenue": 0,
  "profit": 0,
  "employees": 0,
  "asking_price": 0,
  "description": "brief 2-3 sentence summary of the business"
}

Rules:
- All financial values should be numbers (no currency symbols, no commas)
- If a value is not found, use 0 for numbers or "Unknown" for strings
- Convert any GBP/£ values to plain numbers
- For industry, pick the closest match from the list
- Extract as much data as possible from the page content`;

function stripHtml(html: string): string {
	// Remove scripts, styles, and tags — keep text content
	return html
		.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
		.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
		.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
		.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, 12000); // Cap to fit in context window
}

export async function POST(request: NextRequest) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { url } = await request.json();

	if (!url || typeof url !== "string") {
		return NextResponse.json({ error: "URL is required" }, { status: 400 });
	}

	// Fetch the page
	let html: string;
	try {
		const res = await fetch(url, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				Accept: "text/html",
			},
		});

		if (!res.ok) {
			return NextResponse.json({ error: `Failed to fetch URL: ${res.status}` }, { status: 400 });
		}

		html = await res.text();
	} catch {
		return NextResponse.json({ error: "Failed to fetch URL" }, { status: 400 });
	}

	const textContent = stripHtml(html);

	if (textContent.length < 50) {
		return NextResponse.json({ error: "Page content too short to extract data" }, { status: 400 });
	}

	// Extract with GPT-4
	try {
		const completion = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{ role: "system", content: EXTRACT_PROMPT },
				{
					role: "user",
					content: `Extract business listing data from this page content:\n\n${textContent}`,
				},
			],
			temperature: 0.1,
		});

		const raw = completion.choices[0]?.message?.content ?? "";
		const jsonMatch = raw.match(/\{[\s\S]*\}/);

		if (!jsonMatch) {
			return NextResponse.json({ error: "Failed to extract data from page" }, { status: 422 });
		}

		const extracted = JSON.parse(jsonMatch[0]);

		return NextResponse.json({
			data: {
				title: extracted.title ?? "Untitled Listing",
				industry: extracted.industry ?? "Other",
				city: extracted.city ?? "London",
				country: extracted.country ?? "United Kingdom",
				revenue: Number(extracted.revenue) || 0,
				profit: Number(extracted.profit) || 0,
				employees: Number(extracted.employees) || 0,
				asking_price: Number(extracted.asking_price) || 0,
				description: extracted.description ?? "",
			},
			source_url: url,
		});
	} catch {
		return NextResponse.json({ error: "AI extraction failed" }, { status: 500 });
	}
}

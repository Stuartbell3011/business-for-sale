import { type NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/ai/openai";
import { createClient } from "@/lib/supabase/server";

const EXTRACT_PROMPT = `You are a data extraction specialist. Given text content from a business-for-sale listing, extract structured data.

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
- Extract as much data as possible from the content`;

function stripHtml(html: string): string {
	return html
		.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
		.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
		.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
		.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, 12000);
}

async function fetchPage(url: string): Promise<string | null> {
	const headers = {
		"User-Agent":
			"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
		Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
		"Accept-Language": "en-GB,en;q=0.9",
		"Accept-Encoding": "gzip, deflate, br",
		"Cache-Control": "no-cache",
		Referer: "https://www.google.com/",
	};

	// Try direct fetch
	try {
		const res = await fetch(url, { headers, redirect: "follow" });
		if (res.ok) return await res.text();
	} catch {
		// Fall through to cache
	}

	// Try Google webcache
	try {
		const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}`;
		const res = await fetch(cacheUrl, { headers, redirect: "follow" });
		if (res.ok) return await res.text();
	} catch {
		// Fall through
	}

	return null;
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
	const { url, text } = body as { url?: string; text?: string };

	if (!url && !text) {
		return NextResponse.json({ error: "URL or text content is required" }, { status: 400 });
	}

	let textContent: string;

	if (text) {
		// Direct text/HTML pasted by user
		textContent = text.includes("<") ? stripHtml(text) : text.trim();
		textContent = textContent.slice(0, 12000);
	} else {
		// Fetch from URL
		const html = await fetchPage(url as string);
		if (!html) {
			return NextResponse.json(
				{
					error: "Site blocked the request. Try pasting the page content directly instead.",
				},
				{ status: 403 },
			);
		}
		textContent = stripHtml(html);
	}

	if (textContent.length < 50) {
		return NextResponse.json({ error: "Content too short to extract data" }, { status: 400 });
	}

	// Extract with GPT-4
	try {
		const completion = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{ role: "system", content: EXTRACT_PROMPT },
				{
					role: "user",
					content: `Extract business listing data from this content:\n\n${textContent}`,
				},
			],
			temperature: 0.1,
		});

		const raw = completion.choices[0]?.message?.content ?? "";
		const jsonMatch = raw.match(/\{[\s\S]*\}/);

		if (!jsonMatch) {
			return NextResponse.json({ error: "Failed to extract data from content" }, { status: 422 });
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
			source_url: url ?? null,
		});
	} catch {
		return NextResponse.json({ error: "AI extraction failed" }, { status: 500 });
	}
}

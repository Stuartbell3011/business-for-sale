import { type NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/ai/openai";

const EXTRACT_PROMPT = `You are a data extraction specialist for business-for-sale listings. Extract structured data from the provided content.

The content may come from sites like BusinessesForSale.com, RightBiz, Daltons Business, or similar UK business marketplaces.

Return ONLY valid JSON (no markdown code blocks, no explanation):
{
  "title": "short descriptive listing title, e.g. 'Popular Coffee Shop in Shoreditch'",
  "industry": "one of: Cafe, Restaurant, Gym, Salon, Retail, Bar, Services, Tech, Other",
  "city": "city or area name, e.g. 'London' or 'Shoreditch, London'",
  "country": "United Kingdom",
  "revenue": 0,
  "profit": 0,
  "employees": 0,
  "asking_price": 0,
  "description": "2-3 sentence summary of what the business does and why it's for sale"
}

Extraction rules:
- Look for: asking price, turnover/revenue, net profit, staff count, location, business type
- Common labels: "Asking Price", "Turnover", "Net Profit", "Employees", "Location", "Price"
- All financial values must be plain numbers (no £, €, commas, or text like "POA")
- £150,000 → 150000, £1.2m → 1200000, £500k → 500000
- If "Price on Application" or "POA", set asking_price to 0
- If turnover/revenue not found, check for "annual sales" or "T/O"
- For industry, pick the closest match — e.g. "takeaway" → Restaurant, "beauty" → Salon
- Default city to "London" and country to "United Kingdom" if not specified
- NEVER return "Unknown" for title — always create a descriptive title from the content`;

function stripHtml(html: string): string {
	return html
		.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
		.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "")
		.replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, "")
		.replace(/<[^>]+>/g, "\n")
		.replace(/[ \t]+/g, " ")
		.replace(/\n\s*\n/g, "\n")
		.trim()
		.slice(0, 16000);
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

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(data: unknown, status = 200) {
	return NextResponse.json(data, { status, headers: corsHeaders });
}

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
	const body = await request.json();
	const { url, text } = body as { url?: string; text?: string };

	if (!url && !text) {
		return jsonResponse({ error: "URL or text content is required" }, 400);
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
			return jsonResponse(
				{ error: "Site blocked the request. Try pasting the page content directly instead." },
				403,
			);
		}
		textContent = stripHtml(html);
	}

	if (textContent.length < 50) {
		return jsonResponse({ error: "Content too short to extract data" }, 400);
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
			return jsonResponse({ error: "Failed to extract data from content" }, 422);
		}

		const extracted = JSON.parse(jsonMatch[0]);

		return jsonResponse({
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
		return jsonResponse({ error: "AI extraction failed" }, 500);
	}
}

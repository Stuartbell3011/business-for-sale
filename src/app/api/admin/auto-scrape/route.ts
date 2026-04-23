import { type NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/ai/openai";
import { adminSupabase } from "@/lib/supabase/admin";

/**
 * Auto-scrape endpoint — called daily by cron to import new listings.
 *
 * Fetches search pages from listing sites, extracts listing data,
 * deduplicates against existing listings, and saves new ones.
 *
 * Trigger: POST /api/admin/auto-scrape
 * Auth: CRON_SECRET header
 */

const EXTRACT_PROMPT = `You are a data extraction specialist. Given text content from a business-for-sale listing page, extract ALL individual business listings you can find.

Return ONLY a JSON array (no markdown, no explanation):
[
  {
    "title": "descriptive listing title",
    "industry": "Cafe|Restaurant|Gym|Salon|Retail|Bar|Services|Tech|Other",
    "city": "city name",
    "country": "United Kingdom",
    "revenue": 0,
    "profit": 0,
    "employees": 0,
    "asking_price": 0
  }
]

Rules:
- Extract EVERY listing on the page, not just one
- Financial values as plain numbers (no £, commas)
- £150,000 → 150000, £1.2m → 1200000
- Default city to "London", country to "United Kingdom"
- Skip navigation, ads, and non-listing content`;

const SEARCH_URLS = [
	"https://uk.businessesforsale.com/uk/search/businesses-for-sale-in-london",
	"https://uk.businessesforsale.com/uk/search/restaurants-for-sale-in-london",
	"https://uk.businessesforsale.com/uk/search/cafes-for-sale-in-london",
];

const LONDON_COORDS: Record<string, { lat: number; lng: number }> = {
	soho: { lat: 51.5134, lng: -0.1365 },
	shoreditch: { lat: 51.5265, lng: -0.0798 },
	camden: { lat: 51.5392, lng: -0.1426 },
	clapham: { lat: 51.4621, lng: -0.1681 },
	default: { lat: 51.509, lng: -0.118 },
};

function guessCoords(city: string) {
	const lower = city.toLowerCase();
	for (const [area, coords] of Object.entries(LONDON_COORDS)) {
		if (area !== "default" && lower.includes(area)) return coords;
	}
	return LONDON_COORDS.default;
}

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

export async function POST(request: NextRequest) {
	const authHeader = request.headers.get("authorization");
	const cronSecret = process.env.CRON_SECRET;

	if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	// Get existing listing titles for deduplication
	const { data: existing } = await adminSupabase
		.from("businesses")
		.select("title")
		.is("deleted_at", null);

	const existingTitles = new Set((existing ?? []).map((b) => b.title.toLowerCase()));

	let totalNew = 0;
	let totalSkipped = 0;
	const errors: string[] = [];

	for (const searchUrl of SEARCH_URLS) {
		try {
			// Fetch search page
			const res = await fetch(searchUrl, {
				headers: {
					"User-Agent":
						"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
					Accept: "text/html",
					"Accept-Language": "en-GB,en;q=0.9",
					Referer: "https://www.google.com/",
				},
			});

			if (!res.ok) {
				errors.push(`${searchUrl}: HTTP ${res.status}`);
				continue;
			}

			const html = await res.text();
			const text = stripHtml(html);

			if (text.length < 200) {
				errors.push(`${searchUrl}: content too short`);
				continue;
			}

			// Extract listings with AI
			const completion = await openai.chat.completions.create({
				model: "gpt-4o-mini",
				messages: [
					{ role: "system", content: EXTRACT_PROMPT },
					{ role: "user", content: `Extract all business listings:\n\n${text}` },
				],
				temperature: 0.1,
			});

			const raw = completion.choices[0]?.message?.content ?? "";
			const jsonMatch = raw.match(/\[[\s\S]*\]/);

			if (!jsonMatch) {
				errors.push(`${searchUrl}: no listings extracted`);
				continue;
			}

			const listings = JSON.parse(jsonMatch[0]);

			for (const listing of listings) {
				const title = listing.title ?? "Untitled";

				// Deduplicate
				if (existingTitles.has(title.toLowerCase())) {
					totalSkipped++;
					continue;
				}

				const coords = guessCoords(listing.city ?? "London");

				await adminSupabase.from("businesses").insert({
					title,
					industry: listing.industry ?? "Other",
					city: listing.city ?? "London",
					country: listing.country ?? "United Kingdom",
					revenue: Number(listing.revenue) || 0,
					profit: Number(listing.profit) || 0,
					employees: Number(listing.employees) || 0,
					asking_price: Number(listing.asking_price) || 0,
					latitude: coords.lat,
					longitude: coords.lng,
					location_precision: "approximate",
					verified: false,
				});

				existingTitles.add(title.toLowerCase());
				totalNew++;
			}
		} catch (err) {
			errors.push(`${searchUrl}: ${err}`);
		}
	}

	return NextResponse.json({
		new_listings: totalNew,
		skipped_duplicates: totalSkipped,
		search_pages: SEARCH_URLS.length,
		errors,
	});
}

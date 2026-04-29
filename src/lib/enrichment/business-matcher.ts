/**
 * AI-powered business matcher.
 * Takes what we know from a listing (industry, area, revenue, price)
 * and tries to identify the actual business using Companies House + OpenAI.
 */

import OpenAI from "openai";
import { getCompanyProfile, searchCompany } from "./companies-house";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type MatchResult = {
	confidence: "high" | "medium" | "low" | "none";
	company_number: string | null;
	company_name: string | null;
	address: string | null;
	postcode: string | null;
	status: string | null;
	incorporated: string | null;
	sic_codes: string[];
	reasoning: string;
};

/**
 * Step 1: Ask AI to generate search terms from the listing
 * Step 2: Search Companies House with each term
 * Step 3: Ask AI to evaluate which (if any) match
 */
export async function matchBusiness(listing: {
	title: string;
	industry: string;
	city: string;
	revenue: number;
	profit: number;
	asking_price: number;
}): Promise<MatchResult> {
	const noMatch: MatchResult = {
		confidence: "none",
		company_number: null,
		company_name: null,
		address: null,
		postcode: null,
		status: null,
		incorporated: null,
		sic_codes: [],
		reasoning: "Could not identify the business",
	};

	// Step 1: Generate search queries
	const queryCompletion = await openai.chat.completions.create({
		model: "gpt-4o-mini",
		messages: [
			{
				role: "system",
				content: `You help identify real businesses from anonymised for-sale listings.
Given a listing title, industry, and location, suggest 3-5 Companies House search queries.

Think about:
- The listing title often hints at the business type and area
- "Café in Camberwell" → search for cafes/restaurants registered in Camberwell/SE5
- Revenue size helps narrow it (£130k = small independent, not a chain)
- SIC codes: 56101 (restaurants), 56102 (takeaway), 56301 (pubs), 47110 (retail)

Return ONLY a JSON array of search strings, no explanation:
["search term 1", "search term 2", "search term 3"]`,
			},
			{
				role: "user",
				content: `Listing: "${listing.title}"
Industry: ${listing.industry}
City: ${listing.city}
Revenue: £${listing.revenue.toLocaleString()}
Asking Price: £${listing.asking_price.toLocaleString()}`,
			},
		],
		temperature: 0.3,
	});

	const queryRaw = queryCompletion.choices[0]?.message?.content ?? "[]";
	let searchQueries: string[];
	try {
		const match = queryRaw.match(/\[[\s\S]*\]/);
		searchQueries = match ? JSON.parse(match[0]) : [];
	} catch {
		return noMatch;
	}

	if (searchQueries.length === 0) return noMatch;

	// Step 2: Search Companies House with each query
	const allResults: { query: string; companies: Awaited<ReturnType<typeof searchCompany>> }[] = [];

	for (const query of searchQueries.slice(0, 5)) {
		const results = await searchCompany(query);
		if (results.length > 0) {
			allResults.push({ query, companies: results });
		}
	}

	if (allResults.length === 0) return noMatch;

	// Flatten unique companies
	const seen = new Set<string>();
	const candidates: {
		company_number: string;
		title: string;
		address_snippet: string;
		company_status: string;
		date_of_creation: string;
	}[] = [];

	for (const { companies } of allResults) {
		for (const co of companies) {
			if (!seen.has(co.company_number)) {
				seen.add(co.company_number);
				candidates.push(co);
			}
		}
	}

	// Step 3: Ask AI to evaluate the candidates
	const evalCompletion = await openai.chat.completions.create({
		model: "gpt-4o-mini",
		messages: [
			{
				role: "system",
				content: `You are matching an anonymised business-for-sale listing to Companies House records.

Consider:
- Location match (is the registered address in the right area?)
- Industry match (does the SIC code / company name match the listing type?)
- Size match (a £130k revenue café is a small company, not a large chain)
- Status (must be "active" — dissolved companies are not for sale)
- Name clues (listing says "award-winning sandwich bar" → company name might contain "sandwich")

Return ONLY valid JSON:
{
  "best_match_index": -1,
  "confidence": "high|medium|low|none",
  "reasoning": "brief explanation"
}

Use -1 if no match is convincing. "high" = very likely this business, "medium" = plausible, "low" = possible but uncertain.`,
			},
			{
				role: "user",
				content: `Listing: "${listing.title}"
Industry: ${listing.industry}
City: ${listing.city}
Revenue: £${listing.revenue.toLocaleString()}
Asking Price: £${listing.asking_price.toLocaleString()}

Companies House candidates:
${candidates
	.map(
		(c, i) =>
			`${i}. ${c.title} (${c.company_number}) — ${c.company_status} since ${c.date_of_creation} — ${c.address_snippet}`,
	)
	.join("\n")}`,
			},
		],
		temperature: 0.1,
	});

	const evalRaw = evalCompletion.choices[0]?.message?.content ?? "";
	let evaluation: { best_match_index: number; confidence: string; reasoning: string };
	try {
		const match = evalRaw.match(/\{[\s\S]*\}/);
		evaluation = match
			? JSON.parse(match[0])
			: { best_match_index: -1, confidence: "none", reasoning: "" };
	} catch {
		return noMatch;
	}

	if (evaluation.best_match_index < 0 || evaluation.confidence === "none") {
		return { ...noMatch, reasoning: evaluation.reasoning || "No convincing match found" };
	}

	const bestCandidate = candidates[evaluation.best_match_index];
	if (!bestCandidate) return noMatch;

	// Get full profile for the matched company
	const profile = await getCompanyProfile(bestCandidate.company_number);

	const address = profile?.registered_office_address
		? [
				profile.registered_office_address.address_line_1,
				profile.registered_office_address.address_line_2,
				profile.registered_office_address.locality,
				profile.registered_office_address.postal_code,
			]
				.filter(Boolean)
				.join(", ")
		: bestCandidate.address_snippet;

	return {
		confidence: evaluation.confidence as MatchResult["confidence"],
		company_number: bestCandidate.company_number,
		company_name: bestCandidate.title,
		address,
		postcode: profile?.registered_office_address?.postal_code ?? null,
		status: profile?.company_status ?? bestCandidate.company_status,
		incorporated: profile?.date_of_creation ?? bestCandidate.date_of_creation,
		sic_codes: profile?.sic_codes ?? [],
		reasoning: evaluation.reasoning,
	};
}

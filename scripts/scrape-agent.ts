/**
 * Next Owner Scraping Agent
 *
 * Automates a real browser to scrape business listing sites,
 * extract data via AI, and save directly to Supabase.
 *
 * Usage:
 *   npx tsx scripts/scrape-agent.ts --site rightbiz --location london --max 10
 *   npx tsx scripts/scrape-agent.ts --url "https://www.rightbiz.co.uk/buy_business/for_sale/634196_london.html"
 *   npx tsx scripts/scrape-agent.ts --site rightbiz --location london --headed true
 */

import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { createClient } from "@supabase/supabase-js";

chromium.use(StealthPlugin());

// ── Config ──────────────────────────────────────────────────────────────────

const API_BASE = process.env.API_BASE ?? "http://localhost:3001";
const DELAY_BETWEEN_PAGES = 3000;
const CLOUDFLARE_WAIT = 8000; // wait for Cloudflare challenge to resolve

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
	process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
);

const SITES: Record<string, SiteConfig> = {
	rightbiz: {
		name: "RightBiz",
		searchUrl: (location: string, category?: string) => {
			const base = `https://www.rightbiz.co.uk/buy_business/for_sale`;
			const params = new URLSearchParams();
			if (location) params.set("location", location);
			if (category) params.set("category", category);
			return `${base}?${params}`;
		},
		listingSelector: 'a[href*="/buy_business/for_sale/"]',
		listingUrlPattern: /\/buy_business\/for_sale\/\d+/,
	},
	businessesforsale: {
		name: "BusinessesForSale",
		searchUrl: (location: string, category?: string) => {
			let url = `https://uk.businessesforsale.com/uk/search/businesses-for-sale/${location}`;
			if (category) url += `/${category}`;
			return url;
		},
		listingSelector: 'a[href*="/uk/"][href*="-for-sale"]',
		listingUrlPattern: /businessesforsale\.com\/uk\//,
	},
	daltons: {
		name: "Daltons Business",
		searchUrl: (location: string) =>
			`https://www.daltonsbusiness.com/businesses-for-sale/location/${location}`,
		listingSelector: 'a[href*="/business-for-sale/"]',
		listingUrlPattern: /\/business-for-sale\//,
	},
};

const LONDON_COORDS: Record<string, { lat: number; lng: number }> = {
	soho: { lat: 51.5134, lng: -0.1365 },
	shoreditch: { lat: 51.5265, lng: -0.0798 },
	camden: { lat: 51.5392, lng: -0.1426 },
	clapham: { lat: 51.4621, lng: -0.1681 },
	chelsea: { lat: 51.4876, lng: -0.1687 },
	islington: { lat: 51.536, lng: -0.1031 },
	hackney: { lat: 51.5432, lng: -0.0553 },
	brixton: { lat: 51.4613, lng: -0.1156 },
	richmond: { lat: 51.4613, lng: -0.3037 },
	"canary wharf": { lat: 51.5054, lng: -0.0235 },
	"notting hill": { lat: 51.5094, lng: -0.1963 },
	default: { lat: 51.509, lng: -0.118 },
};

// ── Types ───────────────────────────────────────────────────────────────────

type SiteConfig = {
	name: string;
	searchUrl: (location: string, category?: string) => string;
	listingSelector: string;
	listingUrlPattern: RegExp;
};

type ExtractedListing = {
	title: string;
	industry: string;
	city: string;
	country: string;
	revenue: number;
	profit: number;
	employees: number;
	asking_price: number;
	description?: string;
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function guessCoords(city: string) {
	const lower = city.toLowerCase();
	for (const [area, coords] of Object.entries(LONDON_COORDS)) {
		if (area !== "default" && lower.includes(area)) return coords;
	}
	return LONDON_COORDS.default;
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs() {
	const args = process.argv.slice(2);
	const parsed: Record<string, string> = {};
	for (let i = 0; i < args.length; i += 2) {
		const key = args[i]?.replace(/^--/, "");
		const value = args[i + 1];
		if (key && value) parsed[key] = value;
	}
	return parsed;
}

async function waitForContent(page: import("playwright").Page, headed: boolean) {
	// Wait for page to be ready — poll for real content (not Cloudflare challenge)
	for (let attempt = 0; attempt < 30; attempt++) {
		const text = await page.evaluate(() => document.body.innerText.slice(0, 500));
		const title = await page.title();

		const isChallenge =
			title.includes("Just a moment") ||
			title.includes("Attention Required") ||
			title.includes("Verify") ||
			text.includes("Verify you are human") ||
			text.includes("Checking your browser") ||
			text.includes("Performing Security Verification");

		if (!isChallenge && text.length > 200) break;

		if (attempt === 0) {
			if (headed) {
				console.log("  ⏳ Cloudflare challenge — solve it in the browser window...");
			} else {
				console.log("  ⏳ Waiting for Cloudflare...");
			}
		}

		await sleep(2000);
	}

	await sleep(1500); // let page fully render

	const text = await page.evaluate(() => {
		const body = document.body.cloneNode(true) as HTMLElement;
		body
			.querySelectorAll("script, style, nav, footer, header, iframe, noscript, svg")
			.forEach((el) => el.remove());
		return body.innerText;
	});

	// Verify we got real content
	if (
		text.includes("Verify you are human") ||
		text.includes("Just a moment") ||
		text.includes("Performing Security Verification") ||
		text.length < 200
	) {
		console.log("  ⚠ Cloudflare challenge didn't resolve");
		return null;
	}

	return text;
}

// ── Agent ───────────────────────────────────────────────────────────────────

async function extractFromPage(pageText: string): Promise<ExtractedListing | null> {
	try {
		const res = await fetch(`${API_BASE}/api/admin/scrape`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ text: pageText }),
		});

		if (!res.ok) {
			const err = await res.json();
			console.error("  ✗ Extract failed:", err.error);
			return null;
		}

		const json = await res.json();
		return json.data;
	} catch (err) {
		console.error("  ✗ API error:", err);
		return null;
	}
}

async function saveListing(data: ExtractedListing, sourceUrl?: string): Promise<boolean> {
	const coords = guessCoords(data.city);

	// Save directly to Supabase with service role (bypasses RLS + auth)
	const { error } = await supabase.from("businesses").insert({
		title: data.title,
		industry: data.industry,
		city: data.city,
		country: data.country,
		revenue: data.revenue,
		profit: data.profit,
		employees: data.employees,
		asking_price: data.asking_price,
		latitude: coords.lat,
		longitude: coords.lng,
		location_precision: "approximate",
		verified: false,
	});

	if (error) {
		console.error("  ✗ Save failed:", error.message);
		return false;
	}

	return true;
}

async function run() {
	const args = parseArgs();
	const siteName = args.site;
	const directUrl = args.url;
	const location = args.location ?? "london";
	const category = args.category;
	const maxListings = parseInt(args.max ?? "10", 10);
	const headed = args.headed === "true";

	if (!siteName && !directUrl) {
		console.log("Next Owner Scraping Agent\n");
		console.log("Usage:");
		console.log("  npx tsx scripts/scrape-agent.ts --site rightbiz --location london --max 10");
		console.log('  npx tsx scripts/scrape-agent.ts --url "https://..."');
		console.log("  npx tsx scripts/scrape-agent.ts --site rightbiz --location london --headed true\n");
		console.log("Sites: rightbiz, businessesforsale, daltons");
		console.log("Options: --location, --category, --max, --headed true");
		process.exit(1);
	}

	const site = siteName ? SITES[siteName] : null;
	if (siteName && !site) {
		console.error(`Unknown site: ${siteName}. Available: ${Object.keys(SITES).join(", ")}`);
		process.exit(1);
	}

	console.log("🚀 Next Owner Scraping Agent");
	console.log(`   Target: ${site?.name ?? directUrl}`);
	console.log(`   Location: ${location}`);
	console.log(`   Max listings: ${maxListings}`);
	console.log(`   Mode: ${headed ? "headed (visible browser)" : "headless"}`);
	console.log("");

	const browser = await chromium.launch({
		headless: !headed,
		args: ["--disable-blink-features=AutomationControlled"],
	});

	const context = await browser.newContext({
		userAgent:
			"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
		viewport: { width: 1280, height: 800 },
		locale: "en-GB",
	});

	// Remove webdriver flag
	await context.addInitScript(() => {
		Object.defineProperty(navigator, "webdriver", { get: () => false });
	});

	const page = await context.newPage();

	try {
		const listingUrls: string[] = [];

		if (directUrl) {
			// Check if this is a search results page (contains /search/)
			const isSearch = directUrl.includes("/search/") || directUrl.includes("?");

			if (isSearch) {
				console.log(`📋 Loading search page: ${directUrl}`);
				await page.goto(directUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
				const content = await waitForContent(page, headed);
				if (content) {
					// Try to find listing links on the page
					const links = await page.$$eval(
						"a[href]",
						(els) => els.map((a) => (a as HTMLAnchorElement).href).filter(Boolean),
					);

					// Filter to likely listing URLs (not nav, not search, has detail-like patterns)
					const listingPatterns = [
						/\/uk\/.*for-sale/i,
						/\/buy_business\/for_sale\/\d+/,
						/\/business-for-sale\//,
						/\/listing\//,
						/\/details\//,
					];

					const searchPagePatterns = [/\/search\//, /\/login/, /\/register/, /\/contact/];

					const candidates = [...new Set(links)].filter((url) => {
						const isListing = listingPatterns.some((p) => p.test(url));
						const isNavigation = searchPagePatterns.some((p) => p.test(url));
						return isListing && !isNavigation && url !== directUrl;
					});

					listingUrls.push(...candidates.slice(0, maxListings));
					console.log(`   Found ${candidates.length} listings, processing ${listingUrls.length}\n`);
				}
			} else {
				listingUrls.push(directUrl);
			}
		} else if (site) {
			const searchUrl = site.searchUrl(location, category);
			console.log(`📋 Loading search: ${searchUrl}`);
			await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

			const content = await waitForContent(page, headed);
			if (!content) {
				await browser.close();
				return;
			}

			const links = await page.$$eval(
				site.listingSelector,
				(els) => els.map((a) => (a as HTMLAnchorElement).href).filter(Boolean),
			);

			const uniqueLinks = [...new Set(links)].filter((url) =>
				site.listingUrlPattern.test(url),
			);

			listingUrls.push(...uniqueLinks.slice(0, maxListings));
			console.log(`   Found ${uniqueLinks.length} listings, processing ${listingUrls.length}\n`);
		}

		if (listingUrls.length === 0) {
			console.log("❌ No listing URLs found. Try --headed true to see the browser.");
			await browser.close();
			return;
		}

		let saved = 0;
		let failed = 0;

		for (let i = 0; i < listingUrls.length; i++) {
			const url = listingUrls[i];
			console.log(`[${i + 1}/${listingUrls.length}] ${url}`);

			try {
				await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

				const pageText = await waitForContent(page, headed);

				if (!pageText || pageText.length < 100) {
					console.log("  ⚠ Page content too short, skipping");
					failed++;
					continue;
				}

				// Check if we got a real page or a challenge
				if (pageText.includes("Verify you are human") || pageText.includes("Just a moment")) {
					console.log("  ⚠ Cloudflare blocked. Try --headed true");
					failed++;
					continue;
				}

				console.log("  🤖 Extracting with AI...");
				const data = await extractFromPage(pageText);

				if (!data || data.title === "Performing Security Verification") {
					console.log("  ⚠ Got Cloudflare page instead of listing");
					failed++;
					continue;
				}

				console.log(`  📝 ${data.title}`);
				console.log(`     ${data.industry} | £${data.asking_price.toLocaleString()} | ${data.city}`);

				const ok = await saveListing(data, url);
				if (ok) {
					console.log("  ✅ Saved to Supabase");
					saved++;
				} else {
					failed++;
				}
			} catch (err) {
				console.error(`  ✗ Error: ${err}`);
				failed++;
			}

			if (i < listingUrls.length - 1) {
				await sleep(DELAY_BETWEEN_PAGES);
			}
		}

		console.log("\n────────────────────────────────");
		console.log(`✅ Saved: ${saved}`);
		console.log(`❌ Failed: ${failed}`);
		console.log(`📊 Total: ${listingUrls.length}`);
	} finally {
		await browser.close();
	}
}

run().catch(console.error);

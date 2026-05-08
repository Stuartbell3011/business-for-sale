/**
 * Google search scraper — finds business info from Google search results.
 * Gets: Google Maps link, rating, review count — all free, no API key.
 */

export type GoogleBusinessInfo = {
	maps_url: string | null;
	rating: number | null;
	review_count: number | null;
	address: string | null;
	phone: string | null;
};

export async function findGoogleBusiness(
	businessName: string,
	location: string,
): Promise<GoogleBusinessInfo> {
	const result: GoogleBusinessInfo = {
		maps_url: null,
		rating: null,
		review_count: null,
		address: null,
		phone: null,
	};

	const query = `${businessName} ${location}`;

	try {
		// Search Google for the business
		const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
		const res = await fetch(searchUrl, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
				"Accept-Language": "en-GB,en;q=0.9",
			},
		});

		if (!res.ok) return result;

		const html = await res.text();

		// Extract Google Maps link
		const mapsMatch = html.match(/https:\/\/www\.google\.com\/maps\/place\/[^"'\s]*/);
		if (mapsMatch) {
			result.maps_url = mapsMatch[0].split("&amp;")[0];
		}

		// Extract rating (e.g., "4.3" from the knowledge panel)
		const ratingMatch = html.match(
			/(\d\.\d)\s*<\/span>\s*<span[^>]*>\((\d[\d,]*)\s*(?:reviews?|Google reviews?)\)/i,
		);
		if (ratingMatch) {
			result.rating = parseFloat(ratingMatch[1]);
			result.review_count = parseInt(ratingMatch[2].replace(/,/g, ""), 10);
		} else {
			// Alternative pattern
			const altRating = html.match(/data-rating="(\d\.\d)"/);
			if (altRating) {
				result.rating = parseFloat(altRating[1]);
			}
			const altReviews = html.match(/(\d[\d,]*)\s*(?:reviews?|Google reviews?)/i);
			if (altReviews) {
				result.review_count = parseInt(altReviews[1].replace(/,/g, ""), 10);
			}
		}

		// Try to find address from structured data
		const addressMatch = html.match(/"streetAddress"\s*:\s*"([^"]+)"/);
		if (addressMatch) {
			result.address = addressMatch[1];
		}

		// Try to find phone
		const phoneMatch = html.match(/"telephone"\s*:\s*"([^"]+)"/);
		if (phoneMatch) {
			result.phone = phoneMatch[1];
		}
	} catch {
		// Silent fail — return what we have
	}

	// Build Maps URL from search if we didn't find one
	if (!result.maps_url) {
		result.maps_url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
	}

	return result;
}

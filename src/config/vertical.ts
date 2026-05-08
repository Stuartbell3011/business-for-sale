export type VerticalConfig = {
	slug: string;
	name: string;
	headline: string;
	subheadline: string;
	supportingText: string;
	industries: string[];
	sellerHeadline: string;
	sellerCopy: string;
	sellerBenefits: string[];
	brokerCopy: string;
	ctaBuyerDescription: string;
	ctaSellerDescription: string;
	socialProofCopy: string;
	searchByAreaCopy: string;
	searchUrls: string[];
	areas: string[];
};

const verticals: Record<string, VerticalConfig> = {
	cafes: {
		slug: "cafes",
		name: "Next Owner Cafes",
		headline: "Find Cafes for Sale in London",
		subheadline:
			"Browse independent cafes, coffee shops, and bakeries — all on an interactive map.",
		supportingText:
			"Next Owner Cafes helps buyers discover cafes for sale across London through a faster, map-first experience. Explore by area, compare opportunities visually, and connect directly with sellers.",
		industries: ["Cafe"],
		sellerHeadline: "Sell Your Cafe Faster",
		sellerCopy:
			"Create a listing in minutes and get discovered by serious buyers searching for cafes across London on Next Owner.",
		sellerBenefits: [
			"Guided listing creation for cafes",
			"AI-assisted listing copy that sells",
			"Interactive map placement for local visibility",
			"Reach buyers specifically looking for cafes",
			"Direct enquiries from serious buyers",
		],
		brokerCopy:
			"Use Next Owner Cafes to market cafe businesses visually, generate more enquiries, and stand out from generic directories.",
		ctaBuyerDescription:
			"Browse the map, discover cafes for sale, and be part of the first Next Owner city launch.",
		ctaSellerDescription:
			"List your cafe on Next Owner and reach serious buyers searching by area.",
		socialProofCopy:
			"Next Owner Cafes is building the fastest way to buy and sell cafes in London. Join early access and be one of the first to discover new opportunities.",
		searchByAreaCopy:
			"A cafe in Shoreditch is completely different from one in Chelsea. London is hyper-local, which is why Next Owner Cafes is built around the map.",
		searchUrls: [
			"https://uk.businessesforsale.com/uk/search/cafes-for-sale-in-london",
			"https://uk.businessesforsale.com/uk/search/coffee-shops-for-sale-in-london",
		],
		areas: [
			"Shoreditch",
			"Soho",
			"Camden",
			"Clapham",
			"Notting Hill",
			"Hackney",
			"Islington",
			"Brixton",
		],
	},
	gyms: {
		slug: "gyms",
		name: "Next Owner Gyms",
		headline: "Find Gyms for Sale in London",
		subheadline: "Browse gyms, fitness studios, and health clubs — all on an interactive map.",
		supportingText:
			"Next Owner Gyms helps buyers discover fitness businesses for sale across London through a faster, map-first experience. Explore by area, compare opportunities visually, and connect directly with sellers.",
		industries: ["Gym"],
		sellerHeadline: "Sell Your Gym Faster",
		sellerCopy:
			"Create a listing in minutes and get discovered by serious buyers searching for gyms across London on Next Owner.",
		sellerBenefits: [
			"Guided listing creation for gyms",
			"AI-assisted listing copy that sells",
			"Interactive map placement for local visibility",
			"Reach buyers specifically looking for gyms",
			"Direct enquiries from serious buyers",
		],
		brokerCopy:
			"Use Next Owner Gyms to market fitness businesses visually, generate more enquiries, and stand out from generic directories.",
		ctaBuyerDescription:
			"Browse the map, discover gyms for sale, and be part of the first Next Owner city launch.",
		ctaSellerDescription: "List your gym on Next Owner and reach serious buyers searching by area.",
		socialProofCopy:
			"Next Owner Gyms is building the fastest way to buy and sell gyms in London. Join early access and be one of the first to discover new opportunities.",
		searchByAreaCopy:
			"A gym in Canary Wharf is completely different from one in Camden. London is hyper-local, which is why Next Owner Gyms is built around the map.",
		searchUrls: [
			"https://uk.businessesforsale.com/uk/search/gyms-for-sale-in-london",
			"https://uk.businessesforsale.com/uk/search/fitness-for-sale-in-london",
		],
		areas: [
			"Canary Wharf",
			"Shoreditch",
			"Camden",
			"Clapham",
			"Chelsea",
			"Islington",
			"Richmond",
			"Brixton",
		],
	},
	restaurants: {
		slug: "restaurants",
		name: "Next Owner Restaurants",
		headline: "Find Restaurants for Sale in London",
		subheadline: "Browse restaurants, takeaways, and food businesses — all on an interactive map.",
		supportingText:
			"Next Owner Restaurants helps buyers discover restaurants for sale across London through a faster, map-first experience. Explore by area, compare opportunities visually, and connect directly with sellers.",
		industries: ["Restaurant"],
		sellerHeadline: "Sell Your Restaurant Faster",
		sellerCopy:
			"Create a listing in minutes and get discovered by serious buyers searching for restaurants across London on Next Owner.",
		sellerBenefits: [
			"Guided listing creation for restaurants",
			"AI-assisted listing copy that sells",
			"Interactive map placement for local visibility",
			"Reach buyers specifically looking for restaurants",
			"Direct enquiries from serious buyers",
		],
		brokerCopy:
			"Use Next Owner Restaurants to market restaurant businesses visually, generate more enquiries, and stand out from generic directories.",
		ctaBuyerDescription:
			"Browse the map, discover restaurants for sale, and be part of the first Next Owner city launch.",
		ctaSellerDescription:
			"List your restaurant on Next Owner and reach serious buyers searching by area.",
		socialProofCopy:
			"Next Owner Restaurants is building the fastest way to buy and sell restaurants in London. Join early access and be one of the first to discover new opportunities.",
		searchByAreaCopy:
			"A restaurant in Soho is completely different from one in Clapham. London is hyper-local, which is why Next Owner Restaurants is built around the map.",
		searchUrls: [
			"https://uk.businessesforsale.com/uk/search/restaurants-for-sale-in-london",
			"https://uk.businessesforsale.com/uk/search/takeaways-for-sale-in-london",
		],
		areas: [
			"Soho",
			"Shoreditch",
			"Camden",
			"Clapham",
			"Mayfair",
			"Notting Hill",
			"Brixton",
			"Islington",
		],
	},
	bars: {
		slug: "bars",
		name: "Next Owner Bars",
		headline: "Find Bars & Pubs for Sale in London",
		subheadline: "Browse bars, pubs, wine bars, and nightlife venues — all on an interactive map.",
		supportingText:
			"Next Owner Bars helps buyers discover bars and pubs for sale across London through a faster, map-first experience. Explore by area, compare opportunities visually, and connect directly with sellers.",
		industries: ["Bar"],
		sellerHeadline: "Sell Your Bar Faster",
		sellerCopy:
			"Create a listing in minutes and get discovered by serious buyers searching for bars and pubs across London on Next Owner.",
		sellerBenefits: [
			"Guided listing creation for bars & pubs",
			"AI-assisted listing copy that sells",
			"Interactive map placement for local visibility",
			"Reach buyers specifically looking for bars",
			"Direct enquiries from serious buyers",
		],
		brokerCopy:
			"Use Next Owner Bars to market bar and pub businesses visually, generate more enquiries, and stand out from generic directories.",
		ctaBuyerDescription:
			"Browse the map, discover bars and pubs for sale, and be part of the first Next Owner city launch.",
		ctaSellerDescription:
			"List your bar or pub on Next Owner and reach serious buyers searching by area.",
		socialProofCopy:
			"Next Owner Bars is building the fastest way to buy and sell bars in London. Join early access and be one of the first to discover new opportunities.",
		searchByAreaCopy:
			"A bar in Soho is completely different from one in Brixton. London is hyper-local, which is why Next Owner Bars is built around the map.",
		searchUrls: [
			"https://uk.businessesforsale.com/uk/search/bars-for-sale-in-london",
			"https://uk.businessesforsale.com/uk/search/pubs-for-sale-in-london",
		],
		areas: ["Soho", "Shoreditch", "Camden", "Clapham", "Mayfair", "Dalston", "Brixton", "Hackney"],
	},
};

const verticalSlug = process.env.NEXT_PUBLIC_VERTICAL ?? "cafes";

export const config: VerticalConfig = verticals[verticalSlug] ?? verticals.cafes;

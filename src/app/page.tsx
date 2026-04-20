import { CtaBanner } from "@/components/marketing/cta-banner";
import { FeaturesGrid } from "@/components/marketing/features-grid";
import { Footer } from "@/components/marketing/footer";
import { ForBrokers } from "@/components/marketing/for-brokers";
import { ForBuyers } from "@/components/marketing/for-buyers";
import { ForSellers } from "@/components/marketing/for-sellers";
import { Hero } from "@/components/marketing/hero";
import { SearchByArea } from "@/components/marketing/search-by-area";
import { SocialProof } from "@/components/marketing/social-proof";

export default function Home() {
	return (
		<main>
			<Hero />
			<SocialProof />
			<SearchByArea />
			<ForBuyers />
			<ForSellers />
			<ForBrokers />
			<FeaturesGrid />
			<CtaBanner
				headline="Ready to Explore Businesses for Sale in London?"
				description="Browse the map, discover opportunities, and be part of the first Next Owner city launch."
				ctaLabel="Browse the Map"
				ctaHref="/marketplace"
			/>
			<CtaBanner
				headline="Selling a Business in London?"
				description="List your business on Next Owner and reach serious buyers searching by area."
				ctaLabel="Create a Listing"
				ctaHref="/seller/onboard"
				variant="muted"
			/>
			<Footer />
		</main>
	);
}

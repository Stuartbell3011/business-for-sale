import type { LucideIcon } from "lucide-react";
import {
	Bookmark,
	Map as MapIcon,
	MapPin,
	MessageSquare,
	Search,
	SlidersHorizontal,
	Smartphone,
	Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Feature = {
	icon: LucideIcon;
	title: string;
	description: string;
};

const features: Feature[] = [
	{
		icon: MapIcon,
		title: "Interactive Map Search",
		description:
			"Browse businesses on a live map. Discover opportunities by area, not just keywords.",
	},
	{
		icon: SlidersHorizontal,
		title: "Category Filters",
		description: "Filter by industry, price, revenue, and location to find exactly what you want.",
	},
	{
		icon: MapPin,
		title: "Area-Based Discovery",
		description: "Search by neighbourhood. A cafe in Shoreditch is different from one in Chelsea.",
	},
	{
		icon: Bookmark,
		title: "Save & Shortlist",
		description: "Save listings to your shortlist and come back to compare them later.",
	},
	{
		icon: MessageSquare,
		title: "Direct Contact",
		description: "Connect directly with sellers and brokers. No middlemen, no delays.",
	},
	{
		icon: Smartphone,
		title: "Mobile Friendly",
		description: "Browse and discover on any device. The full experience, on the go.",
	},
	{
		icon: Sparkles,
		title: "AI-Assisted Listings",
		description: "Sellers create polished listings in minutes with AI-guided onboarding.",
	},
	{
		icon: Search,
		title: "Smart Search",
		description: "Find businesses by area, category, and price range in seconds.",
	},
];

export function FeaturesGrid() {
	return (
		<section className="py-16 md:py-24">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="text-center">
					<h2 className="text-3xl font-bold tracking-tight md:text-4xl">
						Everything You Need to Buy or Sell a Business
					</h2>
					<p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
						One platform for buyers, sellers, and brokers.
					</p>
				</div>

				<div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
					{features.map((feature) => (
						<Card key={feature.title} className="border-0 shadow-sm">
							<CardHeader className="pb-2">
								<feature.icon className="size-8 text-primary" />
								<CardTitle className="mt-2 text-base">{feature.title}</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">{feature.description}</p>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}

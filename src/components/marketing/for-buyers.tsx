import type { LucideIcon } from "lucide-react";
import { Bookmark, Map as MapIcon, MessageSquare, SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Step = {
	number: number;
	icon: LucideIcon;
	title: string;
	description: string;
};

const steps: Step[] = [
	{
		number: 1,
		icon: MapIcon,
		title: "Explore the Map",
		description: "Browse businesses for sale across London by area.",
	},
	{
		number: 2,
		icon: SlidersHorizontal,
		title: "Filter Instantly",
		description: "Search by category, asking price, and location.",
	},
	{
		number: 3,
		icon: Bookmark,
		title: "Save Your Favourites",
		description: "Build a shortlist of the businesses you want to come back to.",
	},
	{
		number: 4,
		icon: MessageSquare,
		title: "Contact Sellers",
		description: "Connect directly with owners and brokers.",
	},
];

export function ForBuyers() {
	return (
		<section id="buyers" className="py-16 md:py-24">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="text-center">
					<h2 className="text-3xl font-bold tracking-tight md:text-4xl">
						A Faster Way to Find Businesses for Sale
					</h2>
					<p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
						Four steps from browsing to contacting a seller.
					</p>
				</div>

				<div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
					{steps.map((step) => (
						<Card key={step.number} className="relative border-0 shadow-sm">
							<CardHeader>
								<div className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
									{step.number}
								</div>
								<step.icon className="mt-3 size-6 text-muted-foreground" />
								<CardTitle className="mt-2 text-base">{step.title}</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">{step.description}</p>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}

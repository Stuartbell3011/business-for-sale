import { Building2, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const trustPoints = [
	{
		icon: MapPin,
		title: "Early Access for London Buyers",
		description: "Be first to discover new opportunities in your area.",
	},
	{
		icon: Building2,
		title: "First Listings Launching Soon",
		description: "Cafes, restaurants, gyms, salons, retail, and more.",
	},
	{
		icon: Users,
		title: "Built for Sellers, Brokers & Investors",
		description: "One platform for everyone in the deal.",
	},
];

export function SocialProof() {
	return (
		<section className="bg-muted/50 py-16 md:py-24">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="text-center">
					<span className="inline-block rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
						Early Access
					</span>
					<h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
						Launching in London
					</h2>
					<p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
						We are building the fastest way to buy and sell businesses in London. Join early access
						and be one of the first to discover new opportunities.
					</p>
				</div>

				<div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
					{trustPoints.map((point) => (
						<div key={point.title} className="text-center">
							<point.icon className="mx-auto size-8 text-primary" />
							<p className="mt-3 font-semibold">{point.title}</p>
							<p className="mt-1 text-sm text-muted-foreground">{point.description}</p>
						</div>
					))}
				</div>

				<div className="mx-auto mt-12 flex max-w-md gap-3">
					<Input type="email" placeholder="you@example.com" />
					<Button>Join Waitlist</Button>
				</div>
			</div>
		</section>
	);
}

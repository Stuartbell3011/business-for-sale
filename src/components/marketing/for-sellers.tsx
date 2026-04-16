import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const benefits = [
	"Guided listing creation — no guesswork",
	"AI-assisted listing copy that sells",
	"Interactive map placement for local visibility",
	"Reach serious buyers searching in your area",
	"Direct enquiries — no middlemen",
];

export function ForSellers() {
	return (
		<section id="sellers" className="bg-muted/50 py-16 md:py-24">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="grid items-center gap-12 lg:grid-cols-2">
					<div>
						<h2 className="text-3xl font-bold tracking-tight md:text-4xl">
							Sell Your Business Faster
						</h2>
						<p className="mt-4 text-lg text-muted-foreground">
							Create a listing in minutes and get discovered by serious buyers searching in London.
							Highlight your location, business type, price, and growth potential with a clean,
							modern listing page.
						</p>
						<div className="mt-8">
							<Button asChild size="lg">
								<Link href="/seller/onboard">Create a Listing</Link>
							</Button>
						</div>
					</div>

					<ul className="space-y-4">
						{benefits.map((benefit) => (
							<li key={benefit} className="flex items-start gap-3">
								<Check className="mt-0.5 size-5 shrink-0 text-primary" />
								<span>{benefit}</span>
							</li>
						))}
					</ul>
				</div>
			</div>
		</section>
	);
}

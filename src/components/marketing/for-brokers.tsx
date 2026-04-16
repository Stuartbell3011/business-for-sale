import { Check } from "lucide-react";

const benefits = [
	"Manage multiple listings from one dashboard",
	"Better listing presentation with structured data",
	"Map-first discovery puts your listings on the map",
	"Local search visibility across London areas",
	"Higher quality leads from serious buyers",
];

export function ForBrokers() {
	return (
		<section id="brokers" className="py-16 md:py-24">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="grid items-center gap-12 lg:grid-cols-2">
					<div>
						<h2 className="text-3xl font-bold tracking-tight md:text-4xl">Built for Brokers</h2>
						<p className="mt-4 text-lg text-muted-foreground">
							Manage multiple listings, improve presentation, and reach more qualified buyers. Use
							the platform to market businesses visually, generate more enquiries, and stand out
							from outdated directories.
						</p>
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

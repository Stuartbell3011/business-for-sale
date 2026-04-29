import { Check } from "lucide-react";

const benefits = [
	"Manage multiple listings",
	"Better listing presentation",
	"Map-first discovery",
	"Local search visibility",
	"Better lead quality",
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
							Next Owner to market businesses visually, generate more enquiries, and stand out from
							outdated directories.
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

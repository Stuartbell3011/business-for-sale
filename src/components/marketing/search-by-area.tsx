import Link from "next/link";

const areas = [
	"Soho",
	"Shoreditch",
	"Camden",
	"Clapham",
	"Canary Wharf",
	"Notting Hill",
	"Richmond",
	"Chelsea",
	"Islington",
	"Hackney",
	"Mayfair",
	"Brixton",
];

export function SearchByArea() {
	return (
		<section className="py-16 md:py-24">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-2xl text-center">
					<h2 className="text-3xl font-bold tracking-tight md:text-4xl">
						Search by Area, Not Just Keywords
					</h2>
					<p className="mt-4 text-lg text-muted-foreground">
						A cafe in Shoreditch is completely different from one in Chelsea. London is hyper-local,
						which is why Next Owner is built around the map. Explore businesses visually, compare
						locations instantly, and discover the right opportunity in the right area.
					</p>
				</div>

				<div className="mt-10 flex flex-wrap justify-center gap-3">
					{areas.map((area) => (
						<Link
							key={area}
							href={`/marketplace?area=${encodeURIComponent(area.toLowerCase())}`}
							className="rounded-full border bg-background px-5 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
						>
							{area}
						</Link>
					))}
				</div>
			</div>
		</section>
	);
}

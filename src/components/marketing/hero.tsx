import { MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
	return (
		<section className="relative">
			{/* Inline header */}
			<header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
				<Link href="/" className="text-xl font-bold">
					BizAcquire
				</Link>
				<nav className="flex items-center gap-4">
					<Link
						href="#buyers"
						className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
					>
						For Buyers
					</Link>
					<Link
						href="#sellers"
						className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
					>
						For Sellers
					</Link>
					<Button asChild size="sm" variant="outline">
						<Link href="/login">Sign In</Link>
					</Button>
				</nav>
			</header>

			{/* Hero content */}
			<div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8 lg:py-32">
				<div className="grid items-center gap-12 lg:grid-cols-2">
					<div>
						<h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
							Find Businesses for Sale in London
						</h1>
						<p className="mt-6 text-xl text-muted-foreground">
							Browse cafes, restaurants, gyms, salons, retail stores, and more &mdash; all on an
							interactive map. Launching first in London.
						</p>
						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<Button asChild size="lg">
								<Link href="/marketplace">Browse the Map</Link>
							</Button>
							<Button asChild size="lg" variant="outline">
								<Link href="/seller/onboard">List Your Business</Link>
							</Button>
						</div>
						<p className="mt-4 text-sm text-muted-foreground">
							Discover businesses by area, compare opportunities faster, and connect directly with
							sellers.
						</p>
					</div>

					{/* Map visual placeholder */}
					<div className="relative hidden aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border bg-muted lg:flex">
						<div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
						<div className="relative flex flex-col items-center gap-3 text-muted-foreground">
							<MapPin className="size-12" />
							<span className="text-sm font-medium">Interactive London Map</span>
						</div>
						{/* Decorative pins */}
						<div className="absolute left-[20%] top-[30%] size-3 rounded-full bg-primary/60" />
						<div className="absolute left-[45%] top-[25%] size-3 rounded-full bg-primary/40" />
						<div className="absolute left-[60%] top-[45%] size-3 rounded-full bg-primary/60" />
						<div className="absolute left-[35%] top-[55%] size-3 rounded-full bg-primary/40" />
						<div className="absolute left-[70%] top-[35%] size-3 rounded-full bg-primary/50" />
						<div className="absolute left-[25%] top-[65%] size-3 rounded-full bg-primary/30" />
					</div>
				</div>
			</div>
		</section>
	);
}

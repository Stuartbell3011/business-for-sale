import Link from "next/link";
import { NavBar } from "@/components/nav/nav-bar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<NavBar />
			<div className="border-b bg-muted/30">
				<div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-2 sm:px-6 lg:px-8">
					<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Admin
					</span>
					<nav className="flex gap-4">
						<Link
							href="/admin/scrape"
							className="text-sm text-muted-foreground transition-colors hover:text-foreground"
						>
							Scrape
						</Link>
						<Link
							href="/admin/listings"
							className="text-sm text-muted-foreground transition-colors hover:text-foreground"
						>
							Listings
						</Link>
					</nav>
				</div>
			</div>
			<div className="min-h-[calc(100vh-105px)]">{children}</div>
		</>
	);
}

import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const platformLinks = [
	{ label: "For Buyers", href: "#buyers" },
	{ label: "For Sellers", href: "#sellers" },
	{ label: "For Brokers", href: "#brokers" },
	{ label: "London Businesses", href: "/marketplace" },
];

const companyLinks = [
	{ label: "About", href: "#" },
	{ label: "Contact", href: "#" },
];

const legalLinks = [
	{ label: "Terms", href: "#" },
	{ label: "Privacy Policy", href: "#" },
];

export function Footer() {
	return (
		<footer className="border-t bg-muted/50">
			<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
				<div className="grid grid-cols-2 gap-8 md:grid-cols-4">
					<div className="col-span-2 md:col-span-1">
						<p className="text-lg font-bold">BizAcquire</p>
						<p className="mt-2 text-sm text-muted-foreground">
							The fastest way to buy and sell businesses in London.
						</p>
					</div>

					<div>
						<p className="text-sm font-semibold">Platform</p>
						<ul className="mt-3 space-y-2">
							{platformLinks.map((link) => (
								<li key={link.label}>
									<Link
										href={link.href}
										className="text-sm text-muted-foreground hover:text-foreground transition-colors"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div>
						<p className="text-sm font-semibold">Company</p>
						<ul className="mt-3 space-y-2">
							{companyLinks.map((link) => (
								<li key={link.label}>
									<Link
										href={link.href}
										className="text-sm text-muted-foreground hover:text-foreground transition-colors"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div>
						<p className="text-sm font-semibold">Legal</p>
						<ul className="mt-3 space-y-2">
							{legalLinks.map((link) => (
								<li key={link.label}>
									<Link
										href={link.href}
										className="text-sm text-muted-foreground hover:text-foreground transition-colors"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>
				</div>

				<Separator className="my-8" />

				<p className="text-center text-sm text-muted-foreground">
					&copy; 2026 BizAcquire. All rights reserved.
				</p>
			</div>
		</footer>
	);
}

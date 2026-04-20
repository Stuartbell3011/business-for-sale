"use client";

import { Bookmark, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function NavBar() {
	const { user, loading, signOut } = useAuth();
	const router = useRouter();

	async function handleSignOut() {
		await signOut();
		router.push("/");
		router.refresh();
	}

	return (
		<header className="border-b">
			<div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
				<div className="flex items-center gap-6">
					<Link href="/" className="text-lg font-bold">
						BizAcquire
					</Link>
					<nav className="hidden items-center gap-4 sm:flex">
						<Link
							href="/marketplace"
							className="text-sm text-muted-foreground transition-colors hover:text-foreground"
						>
							Browse
						</Link>
						{user && (
							<>
								<Link
									href="/seller/dashboard"
									className="text-sm text-muted-foreground transition-colors hover:text-foreground"
								>
									My Listings
								</Link>
								<Link
									href="/marketplace/saved"
									className="text-sm text-muted-foreground transition-colors hover:text-foreground"
								>
									<Bookmark className="inline size-3.5" /> Saved
								</Link>
							</>
						)}
					</nav>
				</div>

				<div className="flex items-center gap-3">
					{loading ? (
						<div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
					) : user ? (
						<>
							<Button asChild variant="outline" size="sm">
								<Link href="/seller/onboard">List Business</Link>
							</Button>
							<Button variant="ghost" size="sm" onClick={handleSignOut}>
								<LogOut className="size-4" />
								<span className="sr-only">Sign out</span>
							</Button>
						</>
					) : (
						<>
							<Button asChild variant="ghost" size="sm">
								<Link href="/login">Sign In</Link>
							</Button>
							<Button asChild size="sm">
								<Link href="/signup">Sign Up</Link>
							</Button>
						</>
					)}
				</div>
			</div>
		</header>
	);
}

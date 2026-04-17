import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ListingNotFound() {
	return (
		<div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
			<h2 className="text-2xl font-bold">Listing Not Found</h2>
			<p className="mt-2 text-muted-foreground">
				This listing may have been removed or doesn&apos;t exist.
			</p>
			<Button asChild className="mt-6">
				<Link href="/marketplace">Back to Marketplace</Link>
			</Button>
		</div>
	);
}

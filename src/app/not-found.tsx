import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
	return (
		<div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
			<h2 className="text-2xl font-bold">Page Not Found</h2>
			<p className="text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist.</p>
			<Button asChild>
				<Link href="/">Go Home</Link>
			</Button>
		</div>
	);
}

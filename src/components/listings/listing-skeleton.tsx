import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ListingSkeleton() {
	return (
		<Card>
			<CardHeader className="pb-2">
				<div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
				<div className="mt-1 h-4 w-1/2 animate-pulse rounded bg-muted" />
			</CardHeader>
			<CardContent>
				<div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
				<div className="mt-3 grid grid-cols-2 gap-2">
					<div className="h-10 animate-pulse rounded bg-muted" />
					<div className="h-10 animate-pulse rounded bg-muted" />
					<div className="h-10 animate-pulse rounded bg-muted" />
					<div className="h-10 animate-pulse rounded bg-muted" />
				</div>
			</CardContent>
		</Card>
	);
}

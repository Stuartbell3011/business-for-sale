export default function ListingLoading() {
	return (
		<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
			<div className="h-4 w-32 animate-pulse rounded bg-muted" />
			<div className="mt-6 h-8 w-2/3 animate-pulse rounded bg-muted" />
			<div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-muted" />
			<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{["a", "b", "c", "d"].map((k) => (
					<div key={k} className="h-24 animate-pulse rounded-lg bg-muted" />
				))}
			</div>
		</div>
	);
}

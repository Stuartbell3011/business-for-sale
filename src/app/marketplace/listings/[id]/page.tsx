export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return <div>Listing detail — {id}</div>;
}

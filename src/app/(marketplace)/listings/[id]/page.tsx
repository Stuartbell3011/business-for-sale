export default function ListingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <div>Listing detail — {params.id}</div>;
}

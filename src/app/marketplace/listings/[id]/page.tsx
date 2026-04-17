import { ArrowLeft, BadgeCheck, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";

type Props = {
	params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { id } = await params;
	const supabase = await createClient();
	const { data } = await supabase.from("businesses").select("title, city").eq("id", id).single();

	if (!data) return { title: "Listing Not Found" };
	return { title: `${data.title} — ${data.city} | BizAcquire` };
}

export default async function ListingDetailPage({ params }: Props) {
	const { id } = await params;
	const supabase = await createClient();

	const { data: business } = await supabase
		.from("businesses")
		.select("*, location_metrics(*)")
		.eq("id", id)
		.is("deleted_at", null)
		.single();

	if (!business) notFound();

	const margin =
		business.revenue > 0 ? ((business.profit / business.revenue) * 100).toFixed(1) : "0";

	return (
		<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
			{/* Breadcrumb */}
			<Link
				href="/marketplace"
				className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Back to Marketplace
			</Link>

			{/* Header */}
			<div className="mt-4">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">{business.title}</h1>
						<div className="mt-2 flex items-center gap-2 text-muted-foreground">
							<MapPin className="size-4" />
							<span>
								{business.city}, {business.country}
							</span>
							{business.verified && (
								<span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
									<BadgeCheck className="size-3" />
									Verified
								</span>
							)}
						</div>
					</div>
					<span className="inline-block rounded-full bg-secondary px-3 py-1 text-sm font-medium">
						{business.industry}
					</span>
				</div>
			</div>

			<Separator className="my-6" />

			{/* Financials */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{[
					{ label: "Asking Price", value: `€${Number(business.asking_price).toLocaleString()}` },
					{ label: "Revenue", value: `€${Number(business.revenue).toLocaleString()}` },
					{ label: "Profit", value: `€${Number(business.profit).toLocaleString()}` },
					{ label: "Margin", value: `${margin}%` },
				].map((stat) => (
					<Card key={stat.label}>
						<CardHeader className="pb-1">
							<p className="text-sm text-muted-foreground">{stat.label}</p>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold">{stat.value}</p>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Details */}
			<div className="mt-8 grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Business Details</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Employees</span>
							<span className="font-medium">{business.employees}</span>
						</div>
						<Separator />
						<div className="flex justify-between">
							<span className="text-muted-foreground">Location Precision</span>
							<span className="font-medium capitalize">{business.location_precision}</span>
						</div>
						<Separator />
						<div className="flex justify-between">
							<span className="text-muted-foreground">Listed</span>
							<span className="font-medium">
								{new Date(business.created_at).toLocaleDateString("en-GB")}
							</span>
						</div>
					</CardContent>
				</Card>

				{/* Location metrics (if available) */}
				{business.location_metrics && business.location_metrics.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle>Location Insights</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{[
								{
									label: "Competition",
									score: business.location_metrics[0].competition_score,
								},
								{ label: "Footfall", score: business.location_metrics[0].footfall_score },
								{
									label: "Opportunity",
									score: business.location_metrics[0].opportunity_score,
								},
							].map((metric) => (
								<div key={metric.label}>
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">{metric.label}</span>
										<span className="font-medium">{metric.score}/100</span>
									</div>
									<div className="mt-1 h-2 rounded-full bg-muted">
										<div
											className="h-2 rounded-full bg-primary"
											style={{ width: `${metric.score}%` }}
										/>
									</div>
								</div>
							))}
						</CardContent>
					</Card>
				)}
			</div>

			{/* CTA */}
			<div className="mt-8">
				<Button size="lg" className="w-full sm:w-auto">
					Request Access
				</Button>
			</div>
		</div>
	);
}

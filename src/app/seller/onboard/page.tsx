"use client";

import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ExtractedDataReview } from "@/components/ai/extracted-data-review";
import { OnboardingChat } from "@/components/ai/onboarding-chat";
import { ProgressSteps } from "@/components/ai/progress-steps";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ExtractedData = {
	title: string;
	industry: string;
	city: string;
	country: string;
	revenue: number;
	profit: number;
	employees: number;
	asking_price: number;
};

type LocationData = {
	latitude: number;
	longitude: number;
	location_precision: "city" | "approximate" | "exact";
};

// London area defaults by common areas
const LONDON_DEFAULT = { latitude: 51.509, longitude: -0.118 };

export default function SellerOnboardPage() {
	const router = useRouter();
	const [step, setStep] = useState(0);
	const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
	const [locationData, setLocationData] = useState<LocationData>({
		latitude: LONDON_DEFAULT.latitude,
		longitude: LONDON_DEFAULT.longitude,
		location_precision: "approximate",
	});
	const [submitting, setSubmitting] = useState(false);

	const handleChatComplete = useCallback((data: ExtractedData) => {
		setExtractedData(data);
		setStep(1);
	}, []);

	const handleReviewConfirm = useCallback((data: ExtractedData) => {
		setExtractedData(data);
		setStep(2);
	}, []);

	async function handleSubmit() {
		if (!extractedData) return;
		setSubmitting(true);

		try {
			const res = await fetch("/api/listings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...extractedData,
					...locationData,
				}),
			});

			if (!res.ok) {
				const err = await res.json();
				toast.error(err.error ?? "Failed to create listing");
				setSubmitting(false);
				return;
			}

			setStep(3);
			toast.success("Listing created!");
		} catch {
			toast.error("Something went wrong");
			setSubmitting(false);
		}
	}

	return (
		<div className="flex flex-col">
			{/* Progress bar */}
			<div className="border-b py-4 px-4">
				<ProgressSteps current={step} />
			</div>

			{/* Step content */}
			<div className="flex-1">
				{step === 0 && (
					<div className="mx-auto h-[calc(100vh-160px)] max-w-2xl">
						<OnboardingChat onComplete={handleChatComplete} />
					</div>
				)}

				{step === 1 && extractedData && (
					<div className="flex items-center justify-center p-8">
						<ExtractedDataReview
							data={extractedData}
							onConfirm={handleReviewConfirm}
							onBack={() => setStep(0)}
						/>
					</div>
				)}

				{step === 2 && (
					<div className="flex items-center justify-center p-8">
						<Card className="mx-auto w-full max-w-lg">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<MapPin className="size-5" />
									Business Location
								</CardTitle>
								<p className="text-sm text-muted-foreground">
									Set the approximate location. The exact address will not be shown publicly.
								</p>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-1.5">
										<Label htmlFor="lat">Latitude</Label>
										<Input
											id="lat"
											type="number"
											step="0.001"
											value={locationData.latitude}
											onChange={(e) =>
												setLocationData({
													...locationData,
													latitude: Number(e.target.value),
												})
											}
										/>
									</div>
									<div className="space-y-1.5">
										<Label htmlFor="lng">Longitude</Label>
										<Input
											id="lng"
											type="number"
											step="0.001"
											value={locationData.longitude}
											onChange={(e) =>
												setLocationData({
													...locationData,
													longitude: Number(e.target.value),
												})
											}
										/>
									</div>
								</div>

								<div className="space-y-1.5">
									<Label>Location Precision</Label>
									<div className="flex gap-2">
										{(["city", "approximate", "exact"] as const).map((p) => (
											<Button
												key={p}
												variant={locationData.location_precision === p ? "default" : "outline"}
												size="sm"
												className="flex-1 capitalize"
												onClick={() => setLocationData({ ...locationData, location_precision: p })}
											>
												{p}
											</Button>
										))}
									</div>
								</div>

								<div className="flex gap-3 pt-2">
									<Button variant="outline" onClick={() => setStep(1)}>
										Back
									</Button>
									<Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
										{submitting ? "Creating..." : "Create Listing"}
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				)}

				{step === 3 && (
					<div className="flex flex-col items-center justify-center gap-4 p-16 text-center">
						<div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
							<MapPin className="size-8 text-primary" />
						</div>
						<h2 className="text-2xl font-bold">Listing Created</h2>
						<p className="text-muted-foreground">
							Your listing is pending review. It will appear on the marketplace once verified.
						</p>
						<div className="flex gap-3">
							<Button variant="outline" onClick={() => router.push("/marketplace")}>
								Browse Marketplace
							</Button>
							<Button
								onClick={() => {
									setStep(0);
									setExtractedData(null);
								}}
							>
								List Another
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

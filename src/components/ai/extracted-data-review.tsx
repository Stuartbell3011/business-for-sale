"use client";

import { useState } from "react";
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

type Props = {
	data: ExtractedData;
	onConfirm: (data: ExtractedData) => void;
	onBack: () => void;
	loading?: boolean;
};

export function ExtractedDataReview({ data, onConfirm, onBack, loading }: Props) {
	const [form, setForm] = useState(data);

	function update(field: keyof ExtractedData, value: string | number) {
		setForm({ ...form, [field]: value });
	}

	return (
		<Card className="mx-auto w-full max-w-lg">
			<CardHeader>
				<CardTitle>Review Your Listing</CardTitle>
				<p className="text-sm text-muted-foreground">
					Check the details below and edit anything that needs correcting.
				</p>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-1.5">
					<Label htmlFor="title">Listing Title</Label>
					<Input id="title" value={form.title} onChange={(e) => update("title", e.target.value)} />
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<Label htmlFor="industry">Industry</Label>
						<Input
							id="industry"
							value={form.industry}
							onChange={(e) => update("industry", e.target.value)}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="city">City</Label>
						<Input id="city" value={form.city} onChange={(e) => update("city", e.target.value)} />
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<Label htmlFor="revenue">Annual Revenue (€)</Label>
						<Input
							id="revenue"
							type="number"
							value={form.revenue}
							onChange={(e) => update("revenue", Number(e.target.value))}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="profit">Annual Profit (€)</Label>
						<Input
							id="profit"
							type="number"
							value={form.profit}
							onChange={(e) => update("profit", Number(e.target.value))}
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<Label htmlFor="employees">Employees</Label>
						<Input
							id="employees"
							type="number"
							value={form.employees}
							onChange={(e) => update("employees", Number(e.target.value))}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="asking_price">Asking Price (€)</Label>
						<Input
							id="asking_price"
							type="number"
							value={form.asking_price}
							onChange={(e) => update("asking_price", Number(e.target.value))}
						/>
					</div>
				</div>

				<div className="flex gap-3 pt-2">
					<Button variant="outline" onClick={onBack} disabled={loading}>
						Back
					</Button>
					<Button className="flex-1" onClick={() => onConfirm(form)} disabled={loading}>
						{loading ? "Creating listing..." : "Create Listing"}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

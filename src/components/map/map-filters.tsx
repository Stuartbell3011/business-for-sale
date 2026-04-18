"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ListingFilters } from "@/types";

const industries = ["Cafe", "Restaurant", "Gym", "Salon", "Retail", "Bar", "Services", "Tech"];

type Props = {
	filters: ListingFilters;
	onChange: (filters: ListingFilters) => void;
};

export function MapFilters({ filters, onChange }: Props) {
	const activeCount = Object.values(filters).filter(Boolean).length;

	function clear() {
		onChange({});
	}

	return (
		<div className="space-y-4 rounded-lg border bg-background p-4 shadow-sm">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<SlidersHorizontal className="size-4" />
					<span className="text-sm font-semibold">Filters</span>
					{activeCount > 0 && (
						<span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
							{activeCount}
						</span>
					)}
				</div>
				{activeCount > 0 && (
					<Button variant="ghost" size="sm" onClick={clear}>
						<X className="size-3" />
						Clear
					</Button>
				)}
			</div>

			{/* Industry */}
			<div className="space-y-1.5">
				<Label className="text-xs">Industry</Label>
				<div className="flex flex-wrap gap-1.5">
					{industries.map((ind) => (
						<Button
							key={ind}
							variant={filters.industry === ind ? "default" : "outline"}
							size="sm"
							className="h-7 rounded-full text-xs"
							onClick={() =>
								onChange({
									...filters,
									industry: filters.industry === ind ? undefined : ind,
								})
							}
						>
							{ind}
						</Button>
					))}
				</div>
			</div>

			{/* Price range */}
			<div className="grid grid-cols-2 gap-2">
				<div className="space-y-1">
					<Label className="text-xs">Min Price (€)</Label>
					<Input
						type="number"
						placeholder="0"
						className="h-8 text-xs"
						value={filters.min_price ?? ""}
						onChange={(e) =>
							onChange({
								...filters,
								min_price: e.target.value ? Number(e.target.value) : undefined,
							})
						}
					/>
				</div>
				<div className="space-y-1">
					<Label className="text-xs">Max Price (€)</Label>
					<Input
						type="number"
						placeholder="Any"
						className="h-8 text-xs"
						value={filters.max_price ?? ""}
						onChange={(e) =>
							onChange({
								...filters,
								max_price: e.target.value ? Number(e.target.value) : undefined,
							})
						}
					/>
				</div>
			</div>

			{/* Revenue range */}
			<div className="grid grid-cols-2 gap-2">
				<div className="space-y-1">
					<Label className="text-xs">Min Revenue (€)</Label>
					<Input
						type="number"
						placeholder="0"
						className="h-8 text-xs"
						value={filters.min_revenue ?? ""}
						onChange={(e) =>
							onChange({
								...filters,
								min_revenue: e.target.value ? Number(e.target.value) : undefined,
							})
						}
					/>
				</div>
				<div className="space-y-1">
					<Label className="text-xs">Max Revenue (€)</Label>
					<Input
						type="number"
						placeholder="Any"
						className="h-8 text-xs"
						value={filters.max_revenue ?? ""}
						onChange={(e) =>
							onChange({
								...filters,
								max_revenue: e.target.value ? Number(e.target.value) : undefined,
							})
						}
					/>
				</div>
			</div>

			{/* City */}
			<div className="space-y-1">
				<Label className="text-xs">City</Label>
				<Input
					placeholder="e.g. London"
					className="h-8 text-xs"
					value={filters.city ?? ""}
					onChange={(e) =>
						onChange({
							...filters,
							city: e.target.value || undefined,
						})
					}
				/>
			</div>
		</div>
	);
}

"use client";

import { Check, ClipboardPaste, ExternalLink, Link2, Loader2, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ExtractedListing = {
	title: string;
	industry: string;
	city: string;
	country: string;
	revenue: number;
	profit: number;
	employees: number;
	asking_price: number;
	description: string;
};

type ScrapedItem = {
	id: string;
	source: string;
	status: "pending" | "scraping" | "extracted" | "saving" | "saved" | "error";
	data?: ExtractedListing;
	error?: string;
};

const LONDON_COORDS: Record<string, { lat: number; lng: number }> = {
	soho: { lat: 51.5134, lng: -0.1365 },
	shoreditch: { lat: 51.5265, lng: -0.0798 },
	camden: { lat: 51.5392, lng: -0.1426 },
	clapham: { lat: 51.4621, lng: -0.1681 },
	chelsea: { lat: 51.4876, lng: -0.1687 },
	islington: { lat: 51.536, lng: -0.1031 },
	hackney: { lat: 51.5432, lng: -0.0553 },
	brixton: { lat: 51.4613, lng: -0.1156 },
	default: { lat: 51.509, lng: -0.118 },
};

function guessCoords(city: string) {
	const lower = city.toLowerCase();
	for (const [area, coords] of Object.entries(LONDON_COORDS)) {
		if (area !== "default" && lower.includes(area)) return coords;
	}
	return LONDON_COORDS.default;
}

export default function AdminScrapePage() {
	const [mode, setMode] = useState<"url" | "paste" | "bulk">("url");
	const [urlInput, setUrlInput] = useState("");
	const [pasteInput, setPasteInput] = useState("");
	const [bulkInput, setBulkInput] = useState("");
	const [items, setItems] = useState<ScrapedItem[]>([]);
	const [processing, setProcessing] = useState(false);

	function updateItem(id: string, updates: Partial<ScrapedItem>) {
		setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
	}

	// ── Add URLs ────────────────────────────────────────────────────────

	function addUrl() {
		const url = urlInput.trim();
		if (!url) return;
		if (items.some((i) => i.source === url)) {
			toast.error("Already added");
			return;
		}
		setItems((prev) => [...prev, { id: crypto.randomUUID(), source: url, status: "pending" }]);
		setUrlInput("");
	}

	function addBulkUrls() {
		const urls = bulkInput
			.split("\n")
			.map((u) => u.trim())
			.filter((u) => u.startsWith("http"));
		const existing = new Set(items.map((i) => i.source));
		const newItems = urls
			.filter((u) => !existing.has(u))
			.map((u) => ({ id: crypto.randomUUID(), source: u, status: "pending" as const }));
		setItems((prev) => [...prev, ...newItems]);
		setBulkInput("");
		toast.success(`Added ${newItems.length} URLs`);
	}

	// ── Extract ─────────────────────────────────────────────────────────

	async function extractOne(id: string, payload: { url?: string; text?: string }) {
		updateItem(id, { status: "scraping" });
		try {
			const res = await fetch("/api/admin/scrape", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const json = await res.json();
			if (!res.ok) {
				updateItem(id, { status: "error", error: json.error });
			} else {
				updateItem(id, { status: "extracted", data: json.data });
			}
		} catch {
			updateItem(id, { status: "error", error: "Request failed" });
		}
	}

	async function extractPaste() {
		if (!pasteInput.trim()) return;
		const id = crypto.randomUUID();
		setItems((prev) => [...prev, { id, source: "Pasted content", status: "scraping" }]);
		await extractOne(id, { text: pasteInput });
		setPasteInput("");
	}

	async function extractAll() {
		setProcessing(true);
		const pending = items.filter((i) => i.status === "pending" || i.status === "error");
		for (const item of pending) {
			await extractOne(item.id, { url: item.source });
		}
		setProcessing(false);
	}

	// ── Save ────────────────────────────────────────────────────────────

	async function saveOne(id: string) {
		const item = items.find((i) => i.id === id);
		if (!item?.data) return;

		updateItem(id, { status: "saving" });
		const coords = guessCoords(item.data.city);

		try {
			const res = await fetch("/api/listings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...item.data,
					latitude: coords.lat,
					longitude: coords.lng,
					location_precision: "approximate",
				}),
			});
			if (res.ok) {
				updateItem(id, { status: "saved" });
			} else {
				const err = await res.json();
				updateItem(id, { status: "error", error: err.error ?? "Save failed" });
			}
		} catch {
			updateItem(id, { status: "error", error: "Save failed" });
		}
	}

	async function saveAll() {
		const extracted = items.filter((i) => i.status === "extracted");
		for (const item of extracted) {
			await saveOne(item.id);
		}
		toast.success(`Saved ${extracted.length} listings`);
	}

	// ── Counts ──────────────────────────────────────────────────────────

	const pendingCount = items.filter((i) => i.status === "pending" || i.status === "error").length;
	const extractedCount = items.filter((i) => i.status === "extracted").length;
	const savedCount = items.filter((i) => i.status === "saved").length;

	return (
		<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
			<h1 className="text-2xl font-bold">Scrape Listings</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Import business listings from external sites. AI extracts structured data automatically.
			</p>

			{/* Stats */}
			{items.length > 0 && (
				<div className="mt-4 flex gap-4 text-sm">
					<span>{items.length} total</span>
					<span className="text-muted-foreground">|</span>
					<span className="text-blue-600">{extractedCount} extracted</span>
					<span className="text-green-600">{savedCount} saved</span>
					{pendingCount > 0 && <span className="text-amber-600">{pendingCount} pending</span>}
				</div>
			)}

			{/* Mode toggle */}
			<div className="mt-6 flex gap-1">
				<Button
					variant={mode === "url" ? "default" : "outline"}
					size="sm"
					onClick={() => setMode("url")}
				>
					<Link2 className="size-4" />
					Single URL
				</Button>
				<Button
					variant={mode === "bulk" ? "default" : "outline"}
					size="sm"
					onClick={() => setMode("bulk")}
				>
					<Plus className="size-4" />
					Bulk URLs
				</Button>
				<Button
					variant={mode === "paste" ? "default" : "outline"}
					size="sm"
					onClick={() => setMode("paste")}
				>
					<ClipboardPaste className="size-4" />
					Paste Content
				</Button>
			</div>

			{/* Single URL */}
			{mode === "url" && (
				<div className="mt-4 flex gap-2">
					<Input
						placeholder="https://uk.businessesforsale.com/uk/..."
						value={urlInput}
						onChange={(e) => setUrlInput(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && addUrl()}
					/>
					<Button onClick={addUrl} disabled={!urlInput.trim()}>
						Add
					</Button>
				</div>
			)}

			{/* Bulk URLs */}
			{mode === "bulk" && (
				<div className="mt-4 space-y-2">
					<Label className="text-xs text-muted-foreground">One URL per line</Label>
					<Textarea
						placeholder={
							"https://uk.businessesforsale.com/uk/listing-1\nhttps://uk.businessesforsale.com/uk/listing-2\nhttps://uk.businessesforsale.com/uk/listing-3"
						}
						value={bulkInput}
						onChange={(e) => setBulkInput(e.target.value)}
						rows={6}
					/>
					<Button onClick={addBulkUrls} disabled={!bulkInput.trim()}>
						Add All
					</Button>
				</div>
			)}

			{/* Paste */}
			{mode === "paste" && (
				<div className="mt-4 space-y-2">
					<Label className="text-xs text-muted-foreground">
						Cmd+A, Cmd+C on a listing page, then paste here
					</Label>
					<Textarea
						placeholder="Paste listing page content..."
						value={pasteInput}
						onChange={(e) => setPasteInput(e.target.value)}
						rows={6}
					/>
					<Button onClick={extractPaste} disabled={!pasteInput.trim()}>
						Extract Data
					</Button>
				</div>
			)}

			{/* Items list */}
			{items.length > 0 && (
				<div className="mt-6 space-y-2">
					{items.map((item) => (
						<Card
							key={item.id}
							className={
								item.status === "saved"
									? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
									: item.status === "error"
										? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
										: ""
							}
						>
							<CardContent className="flex items-start gap-3 py-3">
								{/* Status icon */}
								<div className="mt-0.5">
									{item.status === "pending" && <div className="size-5 rounded-full border-2" />}
									{(item.status === "scraping" || item.status === "saving") && (
										<Loader2 className="size-5 animate-spin text-primary" />
									)}
									{item.status === "extracted" && <Check className="size-5 text-blue-600" />}
									{item.status === "saved" && <Check className="size-5 text-green-600" />}
									{item.status === "error" && <X className="size-5 text-red-600" />}
								</div>

								{/* Content */}
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										{item.source.startsWith("http") ? (
											<a
												href={item.source}
												target="_blank"
												rel="noopener noreferrer"
												className="truncate text-sm font-medium hover:underline"
											>
												{item.source}
												<ExternalLink className="ml-1 inline size-3" />
											</a>
										) : (
											<span className="text-sm font-medium">{item.source}</span>
										)}
									</div>

									{item.error && <p className="mt-1 text-xs text-red-600">{item.error}</p>}

									{item.data && (
										<div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
											<div>
												<span className="text-muted-foreground">Title: </span>
												{item.data.title}
											</div>
											<div>
												<span className="text-muted-foreground">Industry: </span>
												{item.data.industry}
											</div>
											<div>
												<span className="text-muted-foreground">Price: </span>£
												{item.data.asking_price.toLocaleString()}
											</div>
											<div>
												<span className="text-muted-foreground">Revenue: </span>£
												{item.data.revenue.toLocaleString()}
											</div>
											<div>
												<span className="text-muted-foreground">City: </span>
												{item.data.city}
											</div>
											<div>
												<span className="text-muted-foreground">Employees: </span>
												{item.data.employees}
											</div>
										</div>
									)}
								</div>

								{/* Actions */}
								<div className="flex gap-1">
									{item.status === "extracted" && (
										<Button variant="outline" size="sm" onClick={() => saveOne(item.id)}>
											Save
										</Button>
									)}
									{(item.status === "pending" || item.status === "error") && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
										>
											<Trash2 className="size-4" />
										</Button>
									)}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Bulk actions */}
			{items.length > 0 && (
				<div className="mt-4 flex gap-3">
					{pendingCount > 0 && (
						<Button onClick={extractAll} disabled={processing}>
							{processing ? (
								<>
									<Loader2 className="size-4 animate-spin" />
									Extracting...
								</>
							) : (
								`Extract ${pendingCount} URLs`
							)}
						</Button>
					)}
					{extractedCount > 0 && (
						<Button variant="outline" onClick={saveAll}>
							Save {extractedCount} Listings
						</Button>
					)}
					{items.length > 0 && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setItems([]);
								toast.success("Cleared");
							}}
						>
							Clear All
						</Button>
					)}
				</div>
			)}
		</div>
	);
}

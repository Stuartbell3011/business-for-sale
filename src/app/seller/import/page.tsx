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
	url: string;
	status: "pending" | "scraping" | "extracted" | "saved" | "error";
	data?: ExtractedListing;
	error?: string;
};

// London approximate coordinates by area
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
		if (lower.includes(area)) return coords;
	}
	return LONDON_COORDS.default;
}

export default function ImportPage() {
	const [mode, setMode] = useState<"url" | "paste">("url");
	const [urlInput, setUrlInput] = useState("");
	const [pasteInput, setPasteInput] = useState("");
	const [items, setItems] = useState<ScrapedItem[]>([]);
	const [scraping, setScraping] = useState(false);

	function addUrl() {
		const url = urlInput.trim();
		if (!url) return;
		if (items.some((i) => i.url === url)) {
			toast.error("URL already added");
			return;
		}
		setItems([...items, { url, status: "pending" }]);
		setUrlInput("");
	}

	function removeUrl(url: string) {
		setItems(items.filter((i) => i.url !== url));
	}

	async function scrapeAll() {
		setScraping(true);
		const pending = items.filter((i) => i.status === "pending" || i.status === "error");

		for (const item of pending) {
			setItems((prev) => prev.map((i) => (i.url === item.url ? { ...i, status: "scraping" } : i)));

			try {
				const res = await fetch("/api/admin/scrape", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ url: item.url }),
				});

				const json = await res.json();

				if (!res.ok) {
					setItems((prev) =>
						prev.map((i) =>
							i.url === item.url ? { ...i, status: "error", error: json.error } : i,
						),
					);
					continue;
				}

				setItems((prev) =>
					prev.map((i) =>
						i.url === item.url ? { ...i, status: "extracted", data: json.data } : i,
					),
				);
			} catch {
				setItems((prev) =>
					prev.map((i) =>
						i.url === item.url ? { ...i, status: "error", error: "Network error" } : i,
					),
				);
			}
		}

		setScraping(false);
	}

	async function saveAll() {
		const extracted = items.filter((i) => i.status === "extracted" && i.data);

		for (const item of extracted) {
			const coords = guessCoords(item.data?.city ?? "London");

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
				setItems((prev) => prev.map((i) => (i.url === item.url ? { ...i, status: "saved" } : i)));
			} else {
				const err = await res.json();
				setItems((prev) =>
					prev.map((i) =>
						i.url === item.url
							? { ...i, status: "error", error: err.error ?? "Failed to save" }
							: i,
					),
				);
			}
		}

		toast.success(`Saved ${extracted.length} listings`);
	}

	const extractedCount = items.filter((i) => i.status === "extracted").length;
	const savedCount = items.filter((i) => i.status === "saved").length;

	return (
		<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
			<h1 className="text-2xl font-bold">Import Listings</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Import listings by URL or paste page content directly. AI extracts the data automatically.
			</p>

			{/* Mode toggle */}
			<div className="mt-6 flex gap-1">
				<Button
					variant={mode === "url" ? "default" : "outline"}
					size="sm"
					onClick={() => setMode("url")}
				>
					<Link2 className="size-4" />
					By URL
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

			{/* URL input */}
			{mode === "url" && (
				<div className="mt-4 flex gap-2">
					<Input
						placeholder="https://businessesforsale.com/listing/..."
						value={urlInput}
						onChange={(e) => setUrlInput(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && addUrl()}
					/>
					<Button onClick={addUrl} disabled={!urlInput.trim()}>
						<Plus className="size-4" />
						Add
					</Button>
				</div>
			)}

			{/* Paste input */}
			{mode === "paste" && (
				<div className="mt-4 space-y-2">
					<Label className="text-xs text-muted-foreground">
						Open the listing in your browser, select all (Cmd+A), copy (Cmd+C), and paste here
					</Label>
					<Textarea
						placeholder="Paste the listing page content here (text or HTML)..."
						value={pasteInput}
						onChange={(e) => setPasteInput(e.target.value)}
						rows={8}
					/>
					<Button
						onClick={async () => {
							if (!pasteInput.trim()) return;
							const key = `pasted-${Date.now()}`;
							setItems((prev) => [...prev, { url: key, status: "scraping" }]);
							try {
								const res = await fetch("/api/admin/scrape", {
									method: "POST",
									headers: { "Content-Type": "application/json" },
									body: JSON.stringify({ text: pasteInput }),
								});
								const json = await res.json();
								if (!res.ok) {
									setItems((prev) =>
										prev.map((i) =>
											i.url === key ? { ...i, status: "error", error: json.error } : i,
										),
									);
								} else {
									setItems((prev) =>
										prev.map((i) =>
											i.url === key ? { ...i, status: "extracted", data: json.data } : i,
										),
									);
								}
							} catch {
								setItems((prev) =>
									prev.map((i) => (i.url === key ? { ...i, status: "error", error: "Failed" } : i)),
								);
							}
							setPasteInput("");
						}}
						disabled={!pasteInput.trim()}
					>
						Extract Data
					</Button>
				</div>
			)}

			{/* URL list */}
			{items.length > 0 && (
				<div className="mt-6 space-y-3">
					{items.map((item) => (
						<Card
							key={item.url}
							className={
								item.status === "saved"
									? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
									: item.status === "error"
										? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
										: ""
							}
						>
							<CardContent className="flex items-start gap-3 py-3">
								<div className="mt-0.5">
									{item.status === "pending" && <div className="size-5 rounded-full border-2" />}
									{item.status === "scraping" && (
										<Loader2 className="size-5 animate-spin text-primary" />
									)}
									{item.status === "extracted" && <Check className="size-5 text-blue-600" />}
									{item.status === "saved" && <Check className="size-5 text-green-600" />}
									{item.status === "error" && <X className="size-5 text-red-600" />}
								</div>

								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<a
											href={item.url}
											target="_blank"
											rel="noopener noreferrer"
											className="truncate text-sm font-medium hover:underline"
										>
											{item.url}
										</a>
										<ExternalLink className="size-3 shrink-0 text-muted-foreground" />
									</div>

									{item.status === "error" && (
										<p className="mt-1 text-xs text-red-600">{item.error}</p>
									)}

									{item.data && (
										<div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
											<div>
												<span className="text-muted-foreground">Title: </span>
												{item.data.title}
											</div>
											<div>
												<span className="text-muted-foreground">Industry: </span>
												{item.data.industry}
											</div>
											<div>
												<span className="text-muted-foreground">Price: </span>€
												{item.data.asking_price.toLocaleString()}
											</div>
											<div>
												<span className="text-muted-foreground">Revenue: </span>€
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

								{(item.status === "pending" || item.status === "error") && (
									<Button variant="ghost" size="sm" onClick={() => removeUrl(item.url)}>
										<Trash2 className="size-4" />
									</Button>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Actions */}
			{items.length > 0 && (
				<div className="mt-6 flex items-center gap-3">
					<Button
						onClick={scrapeAll}
						disabled={
							scraping || items.every((i) => i.status !== "pending" && i.status !== "error")
						}
					>
						{scraping ? (
							<>
								<Loader2 className="size-4 animate-spin" />
								Scraping...
							</>
						) : (
							`Scrape ${items.filter((i) => i.status === "pending" || i.status === "error").length} URLs`
						)}
					</Button>

					{extractedCount > 0 && (
						<Button variant="outline" onClick={saveAll}>
							Save {extractedCount} Listings
						</Button>
					)}

					<span className="text-sm text-muted-foreground">
						{savedCount > 0 && `${savedCount} saved`}
					</span>
				</div>
			)}

			{/* Tip */}
			<div className="mt-8 space-y-3">
				<div className="rounded-lg border bg-muted/50 p-4">
					<p className="text-xs font-medium">
						How to import from RightBiz, BusinessesForSale, etc.
					</p>
					<ol className="mt-2 space-y-1 text-xs text-muted-foreground list-decimal pl-4">
						<li>Open the listing page in your browser</li>
						<li>
							Select all content: <kbd className="rounded border bg-background px-1">Cmd+A</kbd>
						</li>
						<li>
							Copy: <kbd className="rounded border bg-background px-1">Cmd+C</kbd>
						</li>
						<li>Switch to &quot;Paste Content&quot; tab above</li>
						<li>
							Paste: <kbd className="rounded border bg-background px-1">Cmd+V</kbd> and click
							Extract Data
						</li>
					</ol>
					<p className="mt-2 text-xs text-muted-foreground">
						Most listing sites block automated scraping. The paste method works with any site.
					</p>
				</div>
			</div>
		</div>
	);
}

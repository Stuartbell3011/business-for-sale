import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bizacquire.com";

	return [
		{ url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
		{
			url: `${baseUrl}/marketplace`,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 0.9,
		},
		{ url: `${baseUrl}/login`, changeFrequency: "monthly", priority: 0.3 },
		{ url: `${baseUrl}/signup`, changeFrequency: "monthly", priority: 0.3 },
	];
}

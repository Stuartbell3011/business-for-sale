import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "BizAcquire — Businesses for Sale in London",
	description:
		"Discover small businesses for sale across London. Browse by area on an interactive map, connect with sellers, and acquire your next venture.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${geistSans.variable} antialiased`}>
				{children}
				<Toaster />
			</body>
		</html>
	);
}

import { NavBar } from "@/components/nav/nav-bar";

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<NavBar />
			<div className="min-h-[calc(100vh-57px)]">{children}</div>
		</>
	);
}

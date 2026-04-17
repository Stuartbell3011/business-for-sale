import { NavBar } from "@/components/nav/nav-bar";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<NavBar />
			<div className="flex min-h-[calc(100vh-57px)] items-center justify-center px-4">
				{children}
			</div>
		</>
	);
}

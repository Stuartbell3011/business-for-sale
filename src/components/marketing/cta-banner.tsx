import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
	headline: string;
	description: string;
	ctaLabel: string;
	ctaHref: string;
	variant?: "default" | "muted";
};

export function CtaBanner({
	headline,
	description,
	ctaLabel,
	ctaHref,
	variant = "default",
}: Props) {
	return (
		<section
			className={cn(
				"py-12 md:py-16",
				variant === "default" ? "bg-primary text-primary-foreground" : "bg-muted/50",
			)}
		>
			<div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
				<h2 className="text-3xl font-bold tracking-tight md:text-4xl">{headline}</h2>
				<p
					className={cn(
						"mx-auto mt-4 max-w-2xl text-lg",
						variant === "default" ? "text-primary-foreground/80" : "text-muted-foreground",
					)}
				>
					{description}
				</p>
				<div className="mt-8">
					<Button asChild size="lg" variant={variant === "default" ? "secondary" : "default"}>
						<Link href={ctaHref}>{ctaLabel}</Link>
					</Button>
				</div>
			</div>
		</section>
	);
}

"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = ["Describe", "Review", "Location", "Done"];

type Props = {
	current: number;
};

export function ProgressSteps({ current }: Props) {
	return (
		<div className="flex items-center justify-center gap-2">
			{steps.map((step, i) => (
				<div key={step} className="flex items-center gap-2">
					<div
						className={cn(
							"flex size-7 items-center justify-center rounded-full text-xs font-medium",
							i < current
								? "bg-primary text-primary-foreground"
								: i === current
									? "bg-primary text-primary-foreground ring-2 ring-primary/30"
									: "bg-muted text-muted-foreground",
						)}
					>
						{i < current ? <Check className="size-3.5" /> : i + 1}
					</div>
					<span
						className={cn(
							"hidden text-xs sm:inline",
							i <= current ? "font-medium" : "text-muted-foreground",
						)}
					>
						{step}
					</span>
					{i < steps.length - 1 && (
						<div className={cn("h-px w-6", i < current ? "bg-primary" : "bg-border")} />
					)}
				</div>
			))}
		</div>
	);
}

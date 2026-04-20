import { Flame, ShieldCheck, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LocationMetrics } from "@/types";

type Props = {
	metrics: LocationMetrics;
	maxBadges?: number;
};

type Badge = {
	label: string;
	icon: typeof Flame;
	color: string;
};

function getBadges(metrics: LocationMetrics): Badge[] {
	const badges: Badge[] = [];

	if (metrics.competition_score < 30) {
		badges.push({
			label: "Low Competition",
			icon: ShieldCheck,
			color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
		});
	}

	if (metrics.footfall_score > 60) {
		badges.push({
			label: "High Foot Traffic",
			icon: Flame,
			color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
		});
	}

	if (metrics.opportunity_score > 70) {
		badges.push({
			label: "High Opportunity",
			icon: TrendingUp,
			color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
		});
	}

	return badges;
}

export function InsightBadges({ metrics, maxBadges }: Props) {
	const badges = getBadges(metrics);
	const visible = maxBadges ? badges.slice(0, maxBadges) : badges;

	if (visible.length === 0) return null;

	return (
		<div className="flex flex-wrap gap-1.5">
			{visible.map((badge) => (
				<span
					key={badge.label}
					className={cn(
						"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
						badge.color,
					)}
				>
					<badge.icon className="size-3" />
					{badge.label}
				</span>
			))}
		</div>
	);
}

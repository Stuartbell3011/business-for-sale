/**
 * Competition score (0–100).
 * Higher = more competition = worse for buyer.
 * Capped at 100 when 10+ same-industry businesses within radius.
 */
export function computeCompetitionScore(sameIndustryNearby: number): number {
	return Math.min(100, Math.round((sameIndustryNearby / 10) * 100));
}

/**
 * Footfall proxy (0–100).
 * Based on total nearby businesses as a proxy for area activity.
 * 50+ nearby businesses = 100 (busy area).
 */
export function computeFootfallProxy(totalBusinessesNearby: number): number {
	return Math.min(100, Math.round((totalBusinessesNearby / 50) * 100));
}

/**
 * Opportunity score (0–100).
 * High footfall + low competition = high opportunity.
 * Formula: footfall * (1 - competition/100)
 */
export function computeOpportunityScore(competition: number, footfall: number): number {
	return Math.round(footfall * (1 - competition / 100));
}

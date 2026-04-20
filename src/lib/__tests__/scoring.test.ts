import { describe, expect, it } from "vitest";
import { computeCompetitionScore, computeFootfallProxy, computeOpportunityScore } from "../scoring";

describe("computeCompetitionScore", () => {
	it("returns 0 when no competitors", () => {
		expect(computeCompetitionScore(0)).toBe(0);
	});

	it("returns 50 when 5 competitors", () => {
		expect(computeCompetitionScore(5)).toBe(50);
	});

	it("caps at 100 when 10+ competitors", () => {
		expect(computeCompetitionScore(10)).toBe(100);
		expect(computeCompetitionScore(20)).toBe(100);
	});
});

describe("computeFootfallProxy", () => {
	it("returns 0 when no nearby businesses", () => {
		expect(computeFootfallProxy(0)).toBe(0);
	});

	it("returns 50 when 25 nearby", () => {
		expect(computeFootfallProxy(25)).toBe(50);
	});

	it("caps at 100 when 50+ nearby", () => {
		expect(computeFootfallProxy(50)).toBe(100);
		expect(computeFootfallProxy(100)).toBe(100);
	});
});

describe("computeOpportunityScore", () => {
	it("returns high score with low competition and high footfall", () => {
		expect(computeOpportunityScore(10, 80)).toBe(72);
	});

	it("returns 0 with 100% competition", () => {
		expect(computeOpportunityScore(100, 80)).toBe(0);
	});

	it("returns 0 with 0 footfall", () => {
		expect(computeOpportunityScore(50, 0)).toBe(0);
	});

	it("returns full footfall with 0 competition", () => {
		expect(computeOpportunityScore(0, 60)).toBe(60);
	});
});

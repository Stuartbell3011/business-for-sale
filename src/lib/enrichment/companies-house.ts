/**
 * Companies House API (free, no key required for basic search)
 * https://developer-specs.company-information.service.gov.uk/
 *
 * API key required for detailed lookups — get one free at:
 * https://developer.company-information.service.gov.uk/
 */

const BASE_URL = "https://api.company-information.service.gov.uk";
const API_KEY = process.env.COMPANIES_HOUSE_API_KEY ?? "";

function authHeaders(): HeadersInit {
	if (!API_KEY) return {};
	return { Authorization: `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}` };
}

export type CompanySearchResult = {
	company_number: string;
	title: string;
	company_status: string;
	date_of_creation: string;
	address_snippet: string;
	company_type: string;
};

export type CompanyProfile = {
	company_number: string;
	company_name: string;
	company_status: string;
	date_of_creation: string;
	type: string;
	registered_office_address: {
		address_line_1?: string;
		address_line_2?: string;
		locality?: string;
		postal_code?: string;
		country?: string;
	};
	sic_codes?: string[];
	accounts?: {
		last_accounts?: {
			made_up_to: string;
			type: string;
		};
		next_due: string;
		accounting_reference_date?: {
			month: string;
			day: string;
		};
	};
	confirmation_statement?: {
		last_made_up_to: string;
		next_due: string;
	};
};

export type FilingAccount = {
	revenue?: number;
	profit?: number;
	net_assets?: number;
	employees?: number;
	period_end: string;
	account_type: string;
};

export type OfficerSummary = {
	name: string;
	role: string;
	appointed_on: string;
	resigned_on?: string;
};

export async function searchCompany(query: string): Promise<CompanySearchResult[]> {
	if (!API_KEY) return [];

	try {
		const res = await fetch(
			`${BASE_URL}/search/companies?q=${encodeURIComponent(query)}&items_per_page=5`,
			{ headers: authHeaders() },
		);

		if (!res.ok) return [];

		const data = await res.json();
		return (data.items ?? []).map((item: Record<string, unknown>) => ({
			company_number: item.company_number,
			title: item.title,
			company_status: item.company_status,
			date_of_creation: item.date_of_creation,
			address_snippet: item.address_snippet,
			company_type: item.company_type,
		}));
	} catch {
		return [];
	}
}

export async function getCompanyProfile(companyNumber: string): Promise<CompanyProfile | null> {
	if (!API_KEY) return null;

	try {
		const res = await fetch(`${BASE_URL}/company/${companyNumber}`, {
			headers: authHeaders(),
		});

		if (!res.ok) return null;
		return await res.json();
	} catch {
		return null;
	}
}

export async function getOfficers(companyNumber: string): Promise<OfficerSummary[]> {
	if (!API_KEY) return [];

	try {
		const res = await fetch(`${BASE_URL}/company/${companyNumber}/officers`, {
			headers: authHeaders(),
		});

		if (!res.ok) return [];

		const data = await res.json();
		return (data.items ?? [])
			.filter((o: Record<string, unknown>) => !o.resigned_on)
			.map((o: Record<string, unknown>) => ({
				name: o.name,
				role: o.officer_role,
				appointed_on: o.appointed_on,
				resigned_on: o.resigned_on,
			}));
	} catch {
		return [];
	}
}

export async function getFilingAccounts(companyNumber: string): Promise<FilingAccount | null> {
	if (!API_KEY) return null;

	try {
		// Get filing history to find the latest accounts
		const res = await fetch(
			`${BASE_URL}/company/${companyNumber}/filing-history?category=accounts&items_per_page=1`,
			{ headers: authHeaders() },
		);

		if (!res.ok) return null;

		const data = await res.json();
		const latest = data.items?.[0];

		if (!latest) return null;

		return {
			period_end: latest.date ?? "",
			account_type: latest.description ?? "",
			// Note: actual financial figures require parsing the XBRL document
			// which is beyond basic API. We return the filing metadata.
		};
	} catch {
		return null;
	}
}

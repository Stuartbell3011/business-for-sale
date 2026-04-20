import { type NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/ai/openai";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are a business listing specialist for BizAcquire, a marketplace for buying and selling small businesses in London.

Your job is to have a friendly conversation with a seller to extract structured data about their business.

Required fields you must collect:
- title: a short name for the listing (e.g. "Established Coffee Shop in Shoreditch")
- industry: the business category (e.g. Cafe, Restaurant, Gym, Salon, Retail, Bar, Services, Tech)
- city: always "London" unless they say otherwise
- country: always "United Kingdom" unless they say otherwise
- revenue: annual revenue in GBP
- profit: annual profit in GBP
- employees: number of employees
- asking_price: how much they want for the business

Conversation approach:
1. Start by asking what kind of business they're selling and a brief description
2. Ask about financials (revenue, profit)
3. Ask about team size and asking price
4. Confirm all details

When you have ALL required fields, respond with ONLY a JSON block in this exact format:
\`\`\`json
{"complete":true,"data":{"title":"...","industry":"...","city":"...","country":"...","revenue":0,"profit":0,"employees":0,"asking_price":0}}
\`\`\`

Do NOT include the JSON until you have collected every field. Ask follow-up questions if anything is unclear or missing. Keep your responses concise and conversational.`;

type ChatMessage = {
	role: "user" | "assistant";
	content: string;
};

export async function POST(request: NextRequest) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await request.json();
	const messages: ChatMessage[] = body.messages ?? [];

	const stream = await openai.chat.completions.create({
		model: "gpt-4o-mini",
		messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
		stream: true,
	});

	const encoder = new TextEncoder();
	const readable = new ReadableStream({
		async start(controller) {
			for await (const chunk of stream) {
				const text = chunk.choices[0]?.delta?.content ?? "";
				if (text) {
					controller.enqueue(encoder.encode(text));
				}
			}
			controller.close();
		},
	});

	return new Response(readable, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		},
	});
}

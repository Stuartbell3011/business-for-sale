"use client";

import { Bot, Send, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Message = {
	role: "user" | "assistant";
	content: string;
};

type ExtractedData = {
	title: string;
	industry: string;
	city: string;
	country: string;
	revenue: number;
	profit: number;
	employees: number;
	asking_price: number;
};

type Props = {
	onComplete: (data: ExtractedData) => void;
};

export function OnboardingChat({ onComplete }: Props) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [streaming, setStreaming] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);
	const started = useRef(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: scroll on every message change
	useEffect(() => {
		scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
	}, [messages]);

	const sendMessage = useCallback(
		async (userMessage: string, history: Message[]) => {
			const newMessages: Message[] = [...history, { role: "user", content: userMessage }];
			setMessages(newMessages);
			setInput("");
			setStreaming(true);

			try {
				const res = await fetch("/api/ai/onboard", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ messages: newMessages }),
				});

				if (!res.ok || !res.body) {
					setMessages([
						...newMessages,
						{ role: "assistant", content: "Something went wrong. Please try again." },
					]);
					setStreaming(false);
					return;
				}

				const reader = res.body.getReader();
				const decoder = new TextDecoder();
				let assistantContent = "";

				setMessages([...newMessages, { role: "assistant", content: "" }]);

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					assistantContent += decoder.decode(value, { stream: true });
					setMessages([...newMessages, { role: "assistant", content: assistantContent }]);
				}

				// Check for completion JSON
				const jsonMatch = assistantContent.match(/```json\s*(\{[\s\S]*?\})\s*```/);
				if (jsonMatch) {
					try {
						const parsed = JSON.parse(jsonMatch[1]);
						if (parsed.complete && parsed.data) {
							onComplete(parsed.data);
						}
					} catch {
						// Not valid JSON yet, continue conversation
					}
				}
			} catch {
				setMessages([
					...newMessages,
					{ role: "assistant", content: "Connection error. Please try again." },
				]);
			} finally {
				setStreaming(false);
			}
		},
		[onComplete],
	);

	// Auto-start conversation
	useEffect(() => {
		if (started.current) return;
		started.current = true;

		async function initChat() {
			setStreaming(true);
			try {
				const res = await fetch("/api/ai/onboard", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ messages: [] }),
				});

				if (!res.ok || !res.body) {
					setMessages([
						{
							role: "assistant",
							content:
								"Hello! I'm here to help you list your business. Tell me about the business you'd like to sell.",
						},
					]);
					setStreaming(false);
					return;
				}

				const reader = res.body.getReader();
				const decoder = new TextDecoder();
				let content = "";

				setMessages([{ role: "assistant", content: "" }]);

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					content += decoder.decode(value, { stream: true });
					setMessages([{ role: "assistant", content }]);
				}
			} catch {
				setMessages([
					{
						role: "assistant",
						content:
							"Hello! I'm here to help you list your business. Tell me about the business you'd like to sell.",
					},
				]);
			} finally {
				setStreaming(false);
			}
		}

		initChat();
	}, []);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!input.trim() || streaming) return;
		sendMessage(input.trim(), messages);
	}

	return (
		<div className="flex h-full flex-col">
			{/* Messages */}
			<div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
				{messages.map((msg, i) => (
					<div
						key={`${msg.role}-${i}`}
						className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}
					>
						<div
							className={cn(
								"flex size-8 shrink-0 items-center justify-center rounded-full",
								msg.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-muted",
							)}
						>
							{msg.role === "assistant" ? <Bot className="size-4" /> : <User className="size-4" />}
						</div>
						<div
							className={cn(
								"max-w-[75%] rounded-lg px-4 py-2 text-sm",
								msg.role === "assistant" ? "bg-muted" : "bg-primary text-primary-foreground",
							)}
						>
							{msg.content || (streaming && <span className="animate-pulse">Thinking...</span>)}
						</div>
					</div>
				))}
			</div>

			{/* Input */}
			<form onSubmit={handleSubmit} className="flex gap-2 border-t p-4">
				<Input
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Describe your business..."
					disabled={streaming}
				/>
				<Button type="submit" size="icon" disabled={streaming || !input.trim()}>
					<Send className="size-4" />
				</Button>
			</form>
		</div>
	);
}

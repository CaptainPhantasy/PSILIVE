"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	Bot,
	Loader2,
	MessageCircle,
	Send,
	ThumbsDown,
	ThumbsUp,
	User,
	X,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ACCESS_METHODS, getActivePromotion } from "@/lib/constants";
import { PROMO_PERCENT } from "@/lib/checkout-pricing";
import { T, useDiversity } from "@/components/diversity/diversity-provider";

interface Message {
	role: "user" | "assistant";
	content: string;
}

// Generate a stable session ID per browser session
function getChatSessionId(): string {
	if (typeof window === "undefined") return "";
	let id = sessionStorage.getItem("chat_session_id");
	if (!id) {
		id = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
		sessionStorage.setItem("chat_session_id", id);
	}
	return id;
}

// Save chat transcript to the database (fire-and-forget)
function saveChatTranscript(sessionId: string, messages: Message[]) {
	if (!sessionId || messages.length <= 1) return; // Don't save just the greeting
	fetch("/api/chat/save", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ sessionId, messages }),
	}).catch((err) => console.error("Failed to save chat transcript:", err));
}

// Render markdown links as clickable Next.js Links
function renderMessageContent(content: string, isUser: boolean) {
	// Match markdown links: [text](url)
	const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
	const parts: (string | JSX.Element)[] = [];
	let lastIndex = 0;
	let match;

	while ((match = linkRegex.exec(content)) !== null) {
		// Add text before the link
		if (match.index > lastIndex) {
			parts.push(content.slice(lastIndex, match.index));
		}

		const linkText = match[1];
		const linkUrl = match[2];

		// Check if it's an internal or external link
		const isInternal = linkUrl.startsWith("/");

		if (isInternal) {
			parts.push(
				<Link
					key={match.index}
					href={linkUrl}
					className={`underline font-medium ${isUser ? "text-white hover:text-primary-100" : "text-primary-600 hover:text-primary-800"}`}
				>
					{linkText}
				</Link>,
			);
		} else {
			parts.push(
				<a
					key={match.index}
					href={linkUrl}
					target="_blank"
					rel="noopener noreferrer"
					className={`underline font-medium ${isUser ? "text-white hover:text-primary-100" : "text-primary-600 hover:text-primary-800"}`}
				>
					{linkText}
				</a>,
			);
		}

		lastIndex = match.index + match[0].length;
	}

	// Add remaining text
	if (lastIndex < content.length) {
		parts.push(content.slice(lastIndex));
	}

	return parts.length > 0 ? parts : content;
}

// System context is now built dynamically on the server from lib/constants
// This ensures the chatbot always has current site data without manual updates

// Generate dynamic greeting based on current site data
function generateDynamicGreeting(): string {
	const promo = getActivePromotion();
	const basePrice =
		ACCESS_METHODS.find((m) => m.method === "Standard Cleanout")?.price ||
		"$159";

	let greeting = "Hi! I'm your Precision Sewer assistant. I can help you:\n\n";

	// Build pricing text dynamically
	if (promo && promo.isActive) {
		const promoText = promo.discountType === "percent"
			? `${promo.discountAmount}% off`
			: `$${promo.discountAmount} off`;
		greeting += `• [Book a sewer inspection](/contact) - ${basePrice} (${promoText} with ${promo.code})\n`;
	} else {
		greeting += `• [Book a sewer inspection](/contact) - Starting at ${basePrice}\n`;
	}

	greeting += `• [Get a FREE video review](/video-review) - We'll review your existing video\n`;
	greeting += `• [Learn about utility locating](/locating)\n`;
	greeting += `• Answer pricing & service questions\n`;

	// Add promo tip only if there's an active promotion
	if (promo && promo.isActive) {
		greeting += `\n**Tip:** Use ${promo.code} for ${PROMO_PERCENT}% off eligible sewer inspection checkout.\n`;
	}

	greeting += `\nWhat can I help you with?`;

	return greeting;
}

const INITIAL_SUGGESTIONS = [
	"💰 What does an inspection cost?",
	"📅 How do I book?",
	"🎥 Tell me about the free video review",
	"🏠 What services do you offer?",
];

function getContextualSuggestions(lastUserMsg: string): string[] {
	const msg = lastUserMsg.toLowerCase();
	if (
		msg.includes("price") ||
		msg.includes("cost") ||
		msg.includes("how much")
	) {
		return [
			"📅 Book an inspection",
			"🏢 Commercial pricing?",
			"📦 Volume packages?",
		];
	}
	if (msg.includes("book") || msg.includes("schedule")) {
		return [
			"💰 What's included?",
			"⏰ How long does it take?",
			"📍 Do you serve my area?",
		];
	}
	if (
		msg.includes("service") ||
		msg.includes("what do you") ||
		msg.includes("what can")
	) {
		return [
			"💰 Pricing details",
			"📅 Book now",
			"🎥 Free video review",
			"🔍 Utility locating",
		];
	}
	if (msg.includes("video") || msg.includes("review")) {
		return ["📅 Book an inspection", "💰 View pricing", "❓ More questions"];
	}
	return ["📅 Book an inspection", "💰 View pricing", "❓ More questions"];
}

export default function AIChat() {
	const { t } = useDiversity();
	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState<Message[]>([
		{ role: "assistant", content: generateDynamicGreeting() },
	]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [suggestions, setSuggestions] = useState<string[]>(INITIAL_SUGGESTIONS);
	const [showFeedback, setShowFeedback] = useState(false);
	const [feedbackGiven, setFeedbackGiven] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const sessionIdRef = useRef<string>("");
	const formRef = useRef<HTMLFormElement>(null);
	const [mounted, setMounted] = useState(false);
	const [showPrompt, setShowPrompt] = useState(true);

	// Wait for client-side mount before rendering portal
	useEffect(() => {
		setMounted(true);
	}, []);

	// Initialize session ID on client only
	useEffect(() => {
		sessionIdRef.current = getChatSessionId();
	}, []);

	useEffect(() => {
		messagesEndRef?.current?.scrollIntoView?.({ behavior: "smooth" });
	}, [messages]);

	// Clear suggestions when user starts typing
	useEffect(() => {
		if (input?.length > 0) {
			setSuggestions([]);
		}
	}, [input]);

	// Hide prompt after 10 seconds or when chat is opened
	useEffect(() => {
		const timer = setTimeout(() => setShowPrompt(false), 10000);
		return () => clearTimeout(timer);
	}, []);

	const handleSuggestionClick = (suggestion: string) => {
		// Strip emoji prefix for cleaner message
		const cleanText = suggestion.replace(/^[^\w]+/, "").trim();
		setInput(cleanText);
		setSuggestions([]);
		// Auto-submit after state update
		setTimeout(() => {
			formRef.current?.requestSubmit();
		}, 50);
	};

	const submitFeedback = (rating: "positive" | "negative") => {
		setFeedbackGiven(true);
		fetch("/api/chat/feedback", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				sessionId: sessionIdRef.current,
				rating,
				comment: "",
			}),
		}).catch((err) => console.error("Failed to save feedback:", err));
		// Hide feedback after 2 seconds
		setTimeout(() => {
			setShowFeedback(false);
			setIsOpen(false);
		}, 2000);
	};

	const handleCloseChat = () => {
		if ((messages?.length ?? 0) > 2 && !feedbackGiven) {
			setShowFeedback(true);
		} else {
			setIsOpen(false);
			setShowFeedback(false);
		}
	};

	const handleOpenChat = () => {
		setShowPrompt(false);
		setIsOpen(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e?.preventDefault?.();
		if (!input?.trim() || isLoading) return;

		const userMessage = input?.trim() ?? "";
		setInput("");
		setSuggestions([]);
		setMessages((prev) => [
			...(prev ?? []),
			{ role: "user", content: userMessage },
		]);
		setIsLoading(true);

		try {
			const response = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					messages: [
						...(messages ?? []),
						{ role: "user", content: userMessage },
					],
				}),
			});

			if (!response?.ok) throw new Error("Failed to get response");

			const reader = response?.body?.getReader?.();
			const decoder = new TextDecoder();
			let assistantMessage = "";

			setMessages((prev) => [
				...(prev ?? []),
				{ role: "assistant", content: "" },
			]);

			while (reader) {
				const { done, value } = (await reader?.read?.()) ?? {
					done: true,
					value: undefined,
				};
				if (done) break;

				const chunk = decoder?.decode?.(value, { stream: true }) ?? "";
				const lines = chunk?.split?.("\n") ?? [];

				for (const line of lines) {
					if (line?.startsWith?.("data: ")) {
						const data = line?.slice?.(6) ?? "";
						if (data === "[DONE]") continue;
						try {
							const parsed = JSON.parse(data);
							const content =
								parsed?.choices?.[0]?.delta?.content ?? parsed?.content ?? "";
							if (content) {
								assistantMessage += content;
								setMessages((prev) => {
									const updated = [...(prev ?? [])];
									if (updated?.length > 0) {
										updated[updated.length - 1] = {
											role: "assistant",
											content: assistantMessage,
										};
									}
									return updated;
								});
							}
						} catch {
							// Skip invalid JSON
						}
					}
				}
			}

			// Set contextual follow-up suggestions
			setSuggestions(getContextualSuggestions(userMessage));
		} catch (error) {
			console.error("Chat error:", error);
			setMessages((prev) => [
				...(prev ?? []),
				{
					role: "assistant",
					content:
						"I apologize, but I'm having trouble responding right now. Please call us at (317) 620-3858 for immediate assistance.",
				},
			]);
		} finally {
			setIsLoading(false);
			// Save transcript after each exchange
			setMessages((current) => {
				saveChatTranscript(sessionIdRef.current, current);
				return current;
			});
		}
	};

	if (!mounted) return null;

	const portalContent = (
		<>
			{/* Chat Button with Attention Prompt */}
			<div
				className="fixed bottom-6 right-6 z-50"
				style={{ display: isOpen ? "none" : "block" }}
			>
				{/* Attention bubble */}
				<AnimatePresence>
					{showPrompt && !isOpen && (
						<motion.div
							initial={{ opacity: 0, y: 10, scale: 0.9 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 10, scale: 0.9 }}
							className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg p-3 w-48 border border-gray-200"
						>
							<button
								onClick={() => setShowPrompt(false)}
								className="absolute -top-2 -right-2 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-300 text-xs"
								aria-label={t("Dismiss")}
							>
								×
							</button>
							<p className="text-sm text-gray-700 font-medium">
								👋 <T>Have questions?</T>
							</p>
							<p className="text-xs text-gray-500 mt-1">
								<T>Chat with our AI assistant!</T>
							</p>
							<div className="absolute bottom-0 right-6 w-3 h-3 bg-white border-r border-b border-gray-200 transform rotate-45 translate-y-1.5" />
						</motion.div>
					)}
				</AnimatePresence>

				{/* Pulsing ring effect */}
				<div className="absolute inset-0 w-14 h-14 bg-primary-400 rounded-full animate-ping opacity-25" />

				<motion.button
					onClick={handleOpenChat}
					className="relative w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 transition-colors"
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					aria-label={t("Open chat")}
				>
					<MessageCircle className="w-6 h-6" />
				</motion.button>
			</div>

			{/* Chat Window */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: 20, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 20, scale: 0.95 }}
						className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] h-[500px] max-h-[calc(100vh-100px)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
					>
						{/* Feedback Overlay */}
						{showFeedback && (
							<div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6">
								{!feedbackGiven ? (
									<>
										<p className="text-gray-900 font-semibold text-lg mb-2">
											<T>How was your experience?</T>
										</p>
										<p className="text-gray-500 text-sm mb-6">
											<T>Your feedback helps us improve</T>
										</p>
										<div className="flex gap-6 mb-6">
											<button
												onClick={() => submitFeedback("positive")}
												className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-green-50 transition-colors group"
											>
												<ThumbsUp className="w-10 h-10 text-gray-400 group-hover:text-green-500 transition-colors" />
												<span className="text-sm text-gray-600 group-hover:text-green-600">
													<T>Helpful</T>
												</span>
											</button>
											<button
												onClick={() => submitFeedback("negative")}
												className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-red-50 transition-colors group"
											>
												<ThumbsDown className="w-10 h-10 text-gray-400 group-hover:text-red-500 transition-colors" />
												<span className="text-sm text-gray-600 group-hover:text-red-600">
													<T>Not helpful</T>
												</span>
											</button>
										</div>
										<button
											onClick={() => {
												setShowFeedback(false);
												setIsOpen(false);
											}}
											className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
										>
											<T>Skip &amp; close</T>
										</button>
									</>
								) : (
									<>
										<div className="text-4xl mb-3">✨</div>
										<p className="text-gray-900 font-semibold text-lg">
											<T>Thank you!</T>
										</p>
										<p className="text-gray-500 text-sm">
											<T>Your feedback helps us improve</T>
										</p>
									</>
								)}
							</div>
						)}

						{/* Header */}
						<div className="bg-primary-600 text-white px-4 py-3 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Bot className="w-5 h-5" />
								<div>
									<h3 className="font-semibold text-sm">
										<T>Sewer Scope Assistant</T>
									</h3>
									<p className="text-xs text-primary-200"><T>24/7 Answers</T></p>
								</div>
							</div>
							<button
								onClick={handleCloseChat}
								className="p-1 hover:bg-primary-500 rounded-lg transition-colors"
								aria-label={t("Close chat")}
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Messages */}
						<div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
							{(messages ?? [])?.map((message, index) => (
								<div
									key={index}
									className={`flex gap-2 ${message?.role === "user" ? "justify-end" : "justify-start"}`}
								>
									{message?.role === "assistant" && (
										<div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
											<Bot className="w-4 h-4 text-primary-600" />
										</div>
									)}
									<div
										className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
											message?.role === "user"
												? "bg-primary-600 text-white rounded-br-md"
												: "bg-white text-gray-700 rounded-bl-md shadow-sm"
										}`}
									>
										{renderMessageContent(
											message?.content ?? "",
											message?.role === "user",
										)}
									</div>
									{message?.role === "user" && (
										<div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
											<User className="w-4 h-4 text-gray-600" />
										</div>
									)}
								</div>
							))}
							{isLoading &&
								(messages ?? [])?.[(messages?.length ?? 1) - 1]?.content ===
									"" && (
									<div className="flex gap-2 justify-start">
										<div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
											<Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
										</div>
										<div className="bg-white text-gray-500 px-4 py-2 rounded-2xl rounded-bl-md shadow-sm text-sm">
											<T>Thinking...</T>
										</div>
									</div>
								)}

							{/* Quick Reply Suggestions */}
							{suggestions.length > 0 && !isLoading && (
								<div className="flex flex-wrap gap-2 px-1 pt-2">
									{suggestions.map((suggestion, i) => (
										<button
											key={i}
											onClick={() => handleSuggestionClick(suggestion)}
											className="text-xs px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full border border-primary-200 hover:bg-primary-100 hover:border-primary-300 transition-colors whitespace-nowrap"
										>
											<T>{suggestion}</T>
										</button>
									))}
								</div>
							)}

							<div ref={messagesEndRef} />
						</div>

						{/* Input */}
						<form
							ref={formRef}
							onSubmit={handleSubmit}
							className="p-3 border-t border-gray-200 bg-white"
						>
							<div className="flex gap-2">
								<input
									type="text"
									value={input}
									onChange={(e) => setInput(e?.target?.value ?? "")}
									placeholder={t("Ask about sewer inspections...")}
									className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
									disabled={isLoading}
								/>
								<button
									type="submit"
									disabled={!input?.trim() || isLoading}
									className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									aria-label={t("Send message")}
								>
									<Send className="w-4 h-4" />
								</button>
							</div>
						</form>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);

	return createPortal(portalContent, document.body) as unknown as JSX.Element;
}

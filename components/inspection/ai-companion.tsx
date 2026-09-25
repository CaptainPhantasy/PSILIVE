// @ts-nocheck
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Bot,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  X,
  Send,
  Loader2,
} from "lucide-react";
import type { InspectionWithRelations } from "@/lib/services/inspection.service";

interface AICompanionProps {
  inspection: InspectionWithRelations;
  currentStage: string;
  onTranscript?: (text: string) => void;
  onDataExtracted?: (data: Record<string, unknown>) => void;
}

interface Message {
  id: string;
  role: "assistant" | "user" | "system";
  content: string;
  timestamp: Date;
}

// Stage-specific guidance
const STAGE_GUIDANCE: Record<string, { title: string; tips: string[] }> = {
  PRE_INSPECTION: {
    title: "Client Interview",
    tips: [
      "Confirm the client's name matches the booking",
      "Verify the property address",
      "Ask about the home's age to help identify pipe material",
      "Inquire about any known sewer issues or backups",
      "Note any recent plumbing work",
    ],
  },
  INSPECTING: {
    title: "Active Inspection",
    tips: [
      "Start from the access point and announce your entry",
      "Call out distance markers for any findings",
      "Speak clearly for voice notes",
      "Look for: roots, cracks, bellies, offset joints",
      "Document the connection to the main line",
    ],
  },
  POST_INSPECTION: {
    title: "Document Findings",
    tips: [
      "Rate the overall pipe condition",
      "Document each defect with location and severity",
      "Note the connection to main status",
      "Provide clear recommendations",
      "Set appropriate urgency level",
    ],
  },
  VIDEO_ATTACH: {
    title: "Upload Video",
    tips: [
      "Select the video from your SD card",
      "Ensure video is at least 5 minutes",
      "Add chapter markers for key findings",
      "Verify upload completes before proceeding",
    ],
  },
  CLIENT_SIGNOFF: {
    title: "Get Signature",
    tips: [
      "Review findings with the client",
      "Answer any questions they have",
      "Have them sign on the device",
      "Confirm their name is spelled correctly",
    ],
  },
};

export function AICompanion({
  inspection,
  currentStage,
  onTranscript,
  onDataExtracted,
}: AICompanionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current stage guidance
  const guidance = STAGE_GUIDANCE[currentStage] || {
    title: currentStage.replace("_", " "),
    tips: ["Continue with your inspection"],
  };

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize with welcome message for stage
  useEffect(() => {
    const welcomeMessage: Message = {
      id: `welcome-${Date.now()}`,
      role: "assistant",
      content: `I'm your AI assistant. Here's what to focus on for **${guidance.title}**:\n\n${guidance.tips.map((t) => `• ${t}`).join("\n")}\n\nTap the microphone or type to ask questions.`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [currentStage, guidance.title, guidance.tips]);

  // Start/stop voice recognition
  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += text + " ";
        } else {
          interim += text;
        }
      }

      if (final) {
        setTranscript((prev) => prev + final);
        onTranscript?.(final);
      }
      setTranscript((prev) => prev + interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech") {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening, onTranscript]);

  // Speak message aloud
  const speak = useCallback(
    (text: string) => {
      if (isMuted || !("speechSynthesis" in window)) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text.replace(/\*\*/g, "").replace(/\n/g, " "));
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    },
    [isMuted]
  );

  // Send message to AI
  const sendMessage = useCallback(async () => {
    const text = inputText.trim() || transcript.trim();
    if (!text) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setTranscript("");
    setIsThinking(true);

    try {
      // Call AI API
      const response = await fetch(`/api/technician/inspections/${inspection.id}/ai-assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          stage: currentStage,
          context: {
            propertyAddress: inspection.job.propertyAddress,
            clientName: inspection.job.clientName,
            overallCondition: inspection.overallCondition,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        speak(data.response);

        // Handle extracted data if present
        if (data.extractedData) {
          onDataExtracted?.(data.extractedData);
        }
      } else {
        throw new Error(data.error || "AI request failed");
      }
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "system",
        content: "Sorry, I couldn't process that. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  }, [inputText, transcript, inspection.id, currentStage, inspection.job.propertyAddress, inspection.job.clientName, inspection.overallCondition, onDataExtracted, speak]);

  // Clear transcript
  const clearTranscript = () => {
    setTranscript("");
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-purple-500 to-blue-500 text-white"
      >
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="font-semibold">AI Assistant</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
            {guidance.title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isListening && (
            <span className="flex items-center gap-1 text-xs">
              <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              Listening
            </span>
          )}
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isExpanded && (
        <div className="flex flex-col h-80">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white"
                      : msg.role === "system"
                      ? "bg-gray-200 text-gray-700"
                      : "bg-white border border-purple-100 text-gray-800"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1 text-purple-600 text-xs font-medium mb-1">
                      <Sparkles className="w-3 h-3" />
                      AI
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-white border border-purple-100 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 text-purple-600 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Transcript */}
          {(transcript || isListening) && (
            <div className="px-3 pb-2">
              <div className="bg-white rounded-lg p-2 border border-purple-200 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-purple-600 text-xs font-medium flex items-center gap-1">
                    <Mic className="w-3 h-3" />
                    Voice Input
                  </span>
                  <button
                    onClick={clearTranscript}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-gray-700">{transcript || "Listening..."}</p>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 border-t border-purple-200 bg-white">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleListening}
                className={`p-2 rounded-full transition-colors ${
                  isListening
                    ? "bg-red-500 text-white"
                    : "bg-purple-100 text-purple-600 hover:bg-purple-200"
                }`}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Ask a question..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-full transition-colors ${
                  isMuted ? "bg-gray-100 text-gray-400" : "bg-purple-100 text-purple-600"
                }`}
                title={isMuted ? "Unmute" : "Mute voice"}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <button
                onClick={sendMessage}
                disabled={isThinking || (!inputText.trim() && !transcript.trim())}
                className="p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

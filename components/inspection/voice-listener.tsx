"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";

interface VoiceListenerProps {
  onTranscript: (text: string) => void;
  fieldName: string;
  placeholder?: string;
  isActive?: boolean;
}

export function VoiceListener({
  onTranscript,
  fieldName,
  placeholder = "Tap microphone to start voice input...",
  isActive = true,
}: VoiceListenerProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check for browser support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
        setError("Voice input not supported in this browser");
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported || !isActive) return;

    shouldListenRef.current = true;
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript + " ";
          } else {
            interim += transcript;
          }
        }

        if (final) {
          setTranscript((prev) => prev + final);
          onTranscript(transcript + final);
        }
        setInterimTranscript(interim);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          shouldListenRef.current = false;
          setError("Microphone access denied. Please enable microphone permissions.");
        } else if (event.error === "no-speech") {
          // Browser silence can end a recognition session; onend restarts while the user is still recording.
        } else {
          setError(`Voice recognition error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        setInterimTranscript("");

        if (shouldListenRef.current && isActive) {
          restartTimeoutRef.current = setTimeout(() => {
            restartTimeoutRef.current = null;
            startListening();
          }, 250);
          return;
        }

        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      shouldListenRef.current = false;
      setError("Failed to start voice input");
      setIsListening(false);
    }
  }, [isSupported, isActive, onTranscript, transcript]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const clearTranscript = () => {
    setTranscript("");
    setInterimTranscript("");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  if (!isSupported) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
        <div className="flex items-center gap-2 text-orange-700">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Voice input not supported. Please type manually.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{fieldName}</label>
        {transcript && (
          <button
            type="button"
            onClick={clearTranscript}
            className="text-xs text-blue-600 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      <div className="relative">
        <div
          className={`min-h-[100px] p-3 pr-12 rounded-lg border-2 transition-colors ${
            isListening
              ? "border-blue-500 bg-blue-50"
              : error
              ? "border-red-300 bg-red-50"
              : "border-gray-200 bg-white"
          }`}
        >
          {transcript || interimTranscript ? (
            <p className="text-gray-800">
              {transcript}
              {interimTranscript && (
                <span className="text-gray-400 italic">{interimTranscript}</span>
              )}
            </p>
          ) : (
            <p className="text-gray-400 italic">{placeholder}</p>
          )}

          {isListening && (
            <div className="absolute bottom-2 left-3 flex items-center gap-1">
              <div className="flex gap-0.5">
                <span className="w-1 h-3 bg-blue-500 rounded-full animate-pulse" />
                <span className="w-1 h-4 bg-blue-500 rounded-full animate-pulse delay-75" />
                <span className="w-1 h-2 bg-blue-500 rounded-full animate-pulse delay-150" />
              </div>
              <span className="text-xs text-blue-600 ml-1">Listening...</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggleListening}
          disabled={!isActive}
          className={`absolute top-2 right-2 p-3 rounded-full transition-all ${
            isListening
              ? "bg-red-500 text-white shadow-lg scale-110"
              : "bg-blue-500 text-white hover:bg-blue-600"
          } ${!isActive ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <p className="text-xs text-gray-500">
        {isListening
          ? "Keep speaking naturally. Browser silence is handled automatically; tap the microphone again to stop."
          : "Tap the microphone to start voice input."}
      </p>
    </div>
  );
}

// Extended global Window interface for TypeScript
/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

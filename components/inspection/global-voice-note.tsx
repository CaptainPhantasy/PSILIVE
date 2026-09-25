"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2, CheckCircle2 } from "lucide-react";

export function GlobalVoiceNote({ inspectionId }: { inspectionId: string }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) return;

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
        setSaveSuccess(false);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript + " ";
          }
        }
        if (final) {
          setTranscript((prev) => prev + final);
        }
      };

      recognition.onerror = (event: { error: string }) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          shouldListenRef.current = false;
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        recognitionRef.current = null;

        if (shouldListenRef.current) {
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
      setIsListening(false);
    }
  }, [isSupported]);

  const stopListeningAndSave = useCallback(async () => {
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

    if (transcript.trim().length > 0) {
      setIsSaving(true);
      try {
        const res = await fetch(`/api/technician/inspections/${inspectionId}/voice-notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: transcript.trim() }),
        });
        if (res.ok) {
          setSaveSuccess(true);
          setTranscript("");
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      } catch (err) {
        console.error("Failed to save voice note:", err);
      } finally {
        setIsSaving(false);
      }
    }
  }, [transcript, inspectionId]);

  const toggleListening = () => {
    if (isListening) {
      stopListeningAndSave();
    } else {
      startListening();
    }
  };

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

  if (!isSupported) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2">
      {isListening && transcript && (
        <div className="bg-white text-gray-800 p-3 rounded-lg shadow-lg border border-blue-200 max-w-xs text-sm mb-2">
          {transcript}
        </div>
      )}
      
      {saveSuccess && (
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full shadow border border-green-200 text-xs font-medium mb-2 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Note Saved
        </div>
      )}

      <button
        onClick={toggleListening}
        disabled={isSaving}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${
          isListening 
            ? "bg-red-500 text-white animate-pulse scale-110" 
            : isSaving 
            ? "bg-gray-400 text-white" 
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
        title="Record Voice Note"
      >
        {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
      </button>
    </div>
  );
}

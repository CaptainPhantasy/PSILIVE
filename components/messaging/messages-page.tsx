"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { ConversationList } from "./conversation-list";
import { ChatWindow } from "./chat-window";
import { Loader2, ArrowLeft, MessageSquare } from "lucide-react";

interface Participant {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    role: string;
    profilePhotoUrl: string | null;
  };
}

interface ConversationItem {
  id: string;
  title: string | null;
  updatedAt: string;
  unreadCount: number;
  participants: Participant[];
  messages: Array<{
    id: string;
    content: string;
    createdAt: string;
    sender: { id: string; name: string };
  }>;
}

interface MessagesPageProps {
  backPath: string;
  backLabel: string;
}

export function MessagesPage({ backPath, backLabel }: MessagesPageProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedConversation, setSelectedConversation] = useState<ConversationItem | null>(null);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push(backPath.includes("admin") ? "/admin" : "/technician/login");
    }
  }, [user, loading, router, backPath]);

  const handleSelectConversation = useCallback((conv: ConversationItem) => {
    setSelectedConversation(conv);
    setShowChatOnMobile(true);
  }, []);

  const handleNewConversation = useCallback(async (targetUser: { id: string; name: string; role: string; profilePhotoUrl: string | null }) => {
    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: targetUser.id }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedConversation({
          ...data.conversation,
          unreadCount: 0,
          messages: [],
        });
        setShowChatOnMobile(true);
      }
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  }, []);

  const getOtherUser = (conv: ConversationItem) => {
    return conv.participants.find((p) => p.userId !== user?.id)?.user || {
      id: "",
      name: "Unknown",
      role: "TECHNICIAN",
      profilePhotoUrl: null,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <header className="bg-blue-600 text-white px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push(backPath)} className="p-1 hover:bg-blue-700 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <MessageSquare className="w-5 h-5" />
        <h1 className="font-semibold">Messages</h1>
      </header>

      {/* Main Content - Split View */}
      <div className="flex h-[calc(100vh-52px)]">
        {/* Sidebar - conversation list */}
        <div className={`w-full lg:w-80 lg:border-r bg-white flex-shrink-0 ${showChatOnMobile ? "hidden lg:flex lg:flex-col" : "flex flex-col"}`}>
          <ConversationList
            selectedId={selectedConversation?.id || null}
            onSelect={handleSelectConversation}
            onNewConversation={handleNewConversation}
          />
        </div>

        {/* Chat Window */}
        <div className={`flex-1 flex flex-col ${showChatOnMobile ? "flex" : "hidden lg:flex"}`}>
          {selectedConversation ? (
            <ChatWindow
              conversationId={selectedConversation.id}
              otherUser={getOtherUser(selectedConversation)}
              onBack={() => setShowChatOnMobile(false)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageSquare className="w-12 h-12 mb-3" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose from existing conversations or start a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

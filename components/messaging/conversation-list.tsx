"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { UserAvatar } from "@/components/user-avatar";
import { Loader2, MessageSquarePlus, Search } from "lucide-react";

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

interface AvailableUser {
  id: string;
  name: string;
  role: string;
  profilePhotoUrl: string | null;
}

interface ConversationListProps {
  selectedId: string | null;
  onSelect: (conv: ConversationItem) => void;
  onNewConversation: (user: AvailableUser) => void;
}

export function ConversationList({ selectedId, onSelect, onNewConversation }: ConversationListProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 8000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) {
        setAvailableUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  }, []);

  useEffect(() => {
    if (showNewChat) fetchUsers();
  }, [showNewChat, fetchUsers]);

  const getOtherUser = (conv: ConversationItem) => {
    return conv.participants.find((p) => p.userId !== user?.id)?.user || {
      id: "",
      name: "Unknown",
      role: "TECHNICIAN",
      profilePhotoUrl: null,
    };
  };

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const dayMs = 86400000;

    if (diff < dayMs && date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }
    if (diff < 7 * dayMs) {
      return date.toLocaleDateString(undefined, { weekday: "short" });
    }
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return "Super Admin";
      case "ADMIN": return "Admin";
      case "TECHNICIAN": return "Technician";
      default: return role;
    }
  };

  const filteredUsers = availableUsers.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Messages</h2>
          <button
            onClick={() => setShowNewChat(!showNewChat)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="New conversation"
          >
            <MessageSquarePlus className="w-5 h-5 text-blue-600" />
          </button>
        </div>
      </div>

      {/* New Chat Panel */}
      {showNewChat && (
        <div className="border-b bg-blue-50 p-3">
          <div className="relative mb-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white rounded-lg text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  onNewConversation(u);
                  setShowNewChat(false);
                  setSearchTerm("");
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <UserAvatar name={u.name} photoUrl={u.profilePhotoUrl} role={u.role} size="sm" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-500">{roleLabel(u.role)}</p>
                </div>
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-2">No team members found</p>
            )}
          </div>
        </div>
      )}

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
            <MessageSquarePlus className="w-10 h-10 mb-2" />
            <p className="text-sm text-center">No conversations yet. Start one by tapping the + button above.</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const other = getOtherUser(conv);
            const lastMsg = conv.messages[0];
            const isSelected = conv.id === selectedId;

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b transition-colors text-left ${
                  isSelected ? "bg-blue-50 border-l-4 border-l-blue-600" : "hover:bg-gray-50 border-l-4 border-l-transparent"
                }`}
              >
                <div className="relative">
                  <UserAvatar name={other.name} photoUrl={other.profilePhotoUrl} role={other.role} size="md" />
                  {conv.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${conv.unreadCount > 0 ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                      {other.name}
                    </p>
                    {lastMsg && (
                      <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
                        {formatTimestamp(lastMsg.createdAt)}
                      </span>
                    )}
                  </div>
                  {lastMsg && (
                    <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? "text-gray-700 font-medium" : "text-gray-500"}`}>
                      {lastMsg.sender.id === user?.id ? "You: " : ""}
                      {lastMsg.content}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

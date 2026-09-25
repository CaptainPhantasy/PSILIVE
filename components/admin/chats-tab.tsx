"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  MessageSquare,
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatConversation {
  id: string;
  sessionId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function ChatsTab() {
  const [chats, setChats] = useState<ChatConversation[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchChats = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/chats?${params}`);
      const data = await res.json();
      if (data.success) {
        setChats(data.chats);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch chats:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const getPreview = (msgs: ChatMessage[]): string => {
    if (!msgs || msgs.length === 0) return "(empty conversation)";
    const firstUser = msgs.find((m) => m.role === "user");
    if (firstUser) return firstUser.content.slice(0, 120) + (firstUser.content.length > 120 ? "…" : "");
    return msgs[0].content.slice(0, 120);
  };

  const messageCount = (msgs: ChatMessage[]): number => {
    return msgs?.length || 0;
  };

  return (
    <div>
      {/* Search */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search transcripts…"
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Search
          </button>
        </div>
        <button
          onClick={() => fetchChats()}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
        {pagination && (
          <span className="text-sm text-gray-500 ml-auto">
            {pagination.total} conversation{pagination.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : chats.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No chat conversations found.
        </div>
      ) : (
        <div className="space-y-2">
          {chats.map((c) => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Summary row */}
              <button
                onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate flex-1">
                  {getPreview(c.messages)}
                </span>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {messageCount(c.messages)} msgs
                </span>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {format(new Date(c.updatedAt), "MMM d, h:mm a")}
                </span>
                {expandedId === c.id ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
              </button>

              {/* Expanded transcript */}
              {expandedId === c.id && (
                <div className="px-4 pb-4 border-t border-gray-100 max-h-96 overflow-y-auto">
                  <div className="space-y-2 mt-3">
                    {(c.messages || []).map((msg, i) => (
                      <div
                        key={i}
                        className={`text-sm p-2 rounded ${
                          msg.role === "user"
                            ? "bg-blue-50 text-gray-900"
                            : "bg-gray-50 text-gray-700"
                        }`}
                      >
                        <span className="text-xs font-semibold text-gray-500 uppercase">
                          {msg.role === "user" ? "Customer" : "AI"}
                        </span>
                        <p className="mt-0.5 whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-gray-400">
                    Session: {c.sessionId.slice(0, 12)}… · Started: {format(new Date(c.createdAt), "MMM d, yyyy h:mm a")}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Search,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  User,
  CheckCircle,
  Bell,
  BellOff,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Clock,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface LeadData {
  id: string;
  sessionToken: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  source: string | null;
  pageUrl: string | null;
  converted: boolean;
  notificationSent: boolean;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export function LeadsTab() {
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
        filter,
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/leads?${params}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setLoading(false);
    }
  }, [page, filter, search]);

  useEffect(() => {
    setLoading(true);
    fetchLeads();
  }, [fetchLeads]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setLoading(true);
    fetchLeads();
  };

  if (loading && leads.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Lead Captures</h3>
          <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {total} total
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Leads</option>
            <option value="unconverted">Unconverted</option>
            <option value="converted">Converted</option>
            <option value="notified">Notified</option>
          </select>
          <button
            onClick={() => { setLoading(true); fetchLeads(); }}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email, name, phone, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Lead List */}
      <div className="space-y-3">
        {leads.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No leads found</p>
          </div>
        ) : (
          leads.map((lead) => (
            <div
              key={lead.id}
              className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${
                lead.converted
                  ? "border-green-500"
                  : lead.notificationSent
                  ? "border-amber-500"
                  : "border-blue-500"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {lead.name && (
                      <span className="font-semibold text-gray-900 flex items-center gap-1">
                        <User className="w-4 h-4 text-gray-500" />
                        {lead.name}
                      </span>
                    )}
                    {lead.converted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3" /> Converted
                      </span>
                    ) : lead.notificationSent ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        <Bell className="w-3 h-3" /> Notified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <BellOff className="w-3 h-3" /> New
                      </span>
                    )}
                  </div>

                  <div className="mt-2 space-y-1">
                    {lead.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline truncate">
                          {lead.email}
                        </a>
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                          {lead.phone}
                        </a>
                      </div>
                    )}
                    {lead.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">
                          {lead.address}
                          {lead.city ? `, ${lead.city}` : ""}
                          {lead.state ? `, ${lead.state}` : ""}
                          {lead.zip ? ` ${lead.zip}` : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                    {lead.source && lead.source !== "website" && (
                      <span className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        {lead.source}
                      </span>
                    )}
                    {lead.pageUrl && (
                      <span className="truncate max-w-[200px]">{lead.pageUrl}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-50"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

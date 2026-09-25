"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";
import {
  Loader2,
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  MessageSquare,
  FileText,
  Video,
  MapPin,
  User,
  AlertTriangle,
  BellRing,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Navigation,
  Timer,
  Camera,
  Mic,
  PenTool,
  Play,
  SkipForward,
  Shield,
  Phone,
  Zap,
  Radio,
  Activity,
  Briefcase,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { OverridePanel } from "@/components/admin/override-panel";
import { UserManagement } from "@/components/admin/user-management";
import { JobManagement } from "@/components/admin/job-management";
import { BookingsTab } from "@/components/admin/bookings-tab";
import { ChatsTab } from "@/components/admin/chats-tab";
import { LeadsTab } from "@/components/admin/leads-tab";
import { AnalyticsTab } from "@/components/admin/analytics-tab";
import { OpsMonitorTab } from "@/components/admin/ops-monitor-tab";
import toast from "react-hot-toast";

// Types
interface LiveInspection {
  id: string;
  inspectionNumber: string;
  currentStage: string;
  currentStageLabel: string;
  progressPercent: number;
  stages: Array<{ id: string; label: string; status: string }>;
  startedAt: string | null;
  arrivedAt: string | null;
  inspectionStartedAt: string | null;
  inspectionEndedAt: string | null;
  inspectionDurationMinutes: number;
  meetsTimeMinimum: boolean;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    eventType: string;
    timestamp: string;
    isOverride: boolean;
  } | null;
  locationHistory: Array<{
    latitude: number;
    longitude: number;
    eventType: string;
    timestamp: string;
  }>;
  collectedData: {
    confirmedClientName: string | null;
    confirmedAddress: string | null;
    homeAge: string | null;
    pipeMaterial: string | null;
    knownIssues: string | null;
    backupHistory: string | null;
    recentWork: string | null;
    overallCondition: string | null;
    rootIntrusion: any;
    cracks: any;
    bellies: any;
    offsetJoints: any;
    blockages: any;
    pipeConditionRating: number | null;
    connectionToMain: string | null;
    recommendations: string | null;
    urgencyLevel: string | null;
  };
  video: {
    id: string;
    fileName: string;
    uploadStatus: string;
    uploadProgress: number | null;
    duration: number | null;
  } | null;
  signature: {
    id: string;
    signerName: string;
    signerRole: string;
    signedAt: string;
  } | null;
  photoCount: number;
  voiceNoteCount: number;
  job: {
    id: string;
    jobNumber: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string | null;
    clientRole: string;
    propertyAddress: string;
    propertyCity: string;
    propertyState: string;
    propertyZip: string;
    propertyLat: number | null;
    propertyLng: number | null;
    scheduledDate: string;
    scheduledTime: string | null;
    accessType: string;
    specialNotes: string | null;
  };
  technician: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  overrideRequest: any;
  createdAt: string;
  updatedAt: string;
}

interface ReviewInspection {
  id: string;
  inspectionNumber: string;
  currentStage: string;
  status: string;
  overallCondition: string | null;
  urgencyLevel: string | null;
  completedAt: string | null;
  job: {
    clientName: string;
    clientEmail: string;
    propertyAddress: string;
    propertyCity: string;
  };
  technician: {
    id: string;
    name: string;
    email: string;
  };
  videoAttachment: {
    id: string;
    uploadStatus: string;
  } | null;
  clientSignature: {
    id: string;
    signerName: string;
  } | null;
}

interface DashboardStats {
  pendingReview: number;
  approvedToday: number;
  deliveredToday: number;
  activeTechnicians: number;
  pendingOverrides: number;
  todayBookings: number;
  totalPaidRevenue: number;
  pendingSubmissions: number;
  totalChats: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = useState<"live" | "ops" | "review" | "jobs" | "users" | "bookings" | "chats" | "leads" | "analytics">("live");
  const [liveInspections, setLiveInspections] = useState<LiveInspection[]>([]);
  const [reviewInspections, setReviewInspections] = useState<ReviewInspection[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [filter, setFilter] = useState<string>("SUBMITTED");
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedInspection, setExpandedInspection] = useState<string | null>(null);
  const [processingOverride, setProcessingOverride] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login");
    } else if (!loading && user && !["ADMIN", "OWNER", "SUPER_ADMIN"].includes(user.role)) {
      router.push("/technician/dashboard");
    }
  }, [user, loading, router]);

  const fetchLiveData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/live-inspections");
      const data = await res.json();
      if (data.success) {
        setLiveInspections(data.inspections);
      }
    } catch (error) {
      console.error("Failed to fetch live inspections:", error);
    }
  }, []);

  const fetchReviewData = useCallback(async () => {
    try {
      const [inspectionsRes, statsRes] = await Promise.all([
        fetch(`/api/admin/inspections?status=${filter}`),
        fetch("/api/admin/stats"),
      ]);

      const inspectionsData = await inspectionsRes.json();
      const statsData = await statsRes.json();

      if (inspectionsData.success) {
        setReviewInspections(inspectionsData.inspections);
      }
      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    if (user) {
      setLoadingData(true);
      Promise.all([fetchLiveData(), fetchReviewData()]).finally(() => {
        setLoadingData(false);
      });
    }
  }, [user, fetchLiveData, fetchReviewData]);

  // Poll live inspections every 10 seconds, review data every 60 seconds
  useEffect(() => {
    if (!user) return;
    const liveInterval = setInterval(fetchLiveData, 10000);
    const reviewInterval = setInterval(fetchReviewData, 60000);
    return () => {
      clearInterval(liveInterval);
      clearInterval(reviewInterval);
    };
  }, [user, fetchLiveData, fetchReviewData]);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = () => {
      fetch("/api/messages/unread").then(r => r.ok ? r.json() : null).then(d => {
        if (d) setUnreadCount(d.unreadCount || 0);
      }).catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchLiveData(), fetchReviewData()]).finally(() => {
      setRefreshing(false);
    });
  };

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  // Admin override actions
  const handleOverride = async (
    inspectionId: string,
    action: string,
    targetStage?: string
  ) => {
    setProcessingOverride(inspectionId);
    try {
      const res = await fetch(`/api/admin/inspections/${inspectionId}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, targetStage }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchLiveData();
        fetchReviewData();
      } else {
        toast.error(data.error || "Override failed");
      }
    } catch (error) {
      toast.error("Failed to process override");
    } finally {
      setProcessingOverride(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-yellow-100 text-yellow-800";
      case "UNDER_REVIEW":
        return "bg-blue-100 text-blue-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getConditionColor = (condition: string | null) => {
    switch (condition) {
      case "GOOD":
        return "text-green-600 bg-green-50";
      case "FAIR":
        return "text-yellow-600 bg-yellow-50";
      case "NEEDS_ATTENTION":
        return "text-orange-600 bg-orange-50";
      case "CRITICAL":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "EN_ROUTE":
        return <Navigation className="w-4 h-4" />;
      case "ARRIVED":
        return <MapPin className="w-4 h-4" />;
      case "PRE_INSPECTION":
        return <FileText className="w-4 h-4" />;
      case "INSPECTING":
        return <Camera className="w-4 h-4" />;
      case "POST_INSPECTION":
        return <Activity className="w-4 h-4" />;
      case "VIDEO_ATTACH":
        return <Video className="w-4 h-4" />;
      case "CLIENT_SIGNOFF":
        return <PenTool className="w-4 h-4" />;
      case "SUBMITTED":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image src="/logo.png" alt="PSI" fill className="object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Admin Console</h1>
              <p className="text-sm text-gray-500">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Live indicator */}
            {liveInspections.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <Radio className="w-3 h-3 animate-pulse" />
                {liveInspections.length} Live
              </div>
            )}
            {stats && stats.pendingOverrides > 0 && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                <BellRing className="w-4 h-4" />
                {stats.pendingOverrides} Alert{stats.pendingOverrides > 1 ? "s" : ""}
              </div>
            )}
            <button
              onClick={() => router.push("/admin/messages")}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Messages"
            >
              <MessageSquare className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => router.push("/admin/profile")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Profile"
            >
              <User className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={refreshing}
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards - Enhanced responsive grid */}
        {stats && (<>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2.5 rounded-lg">
                  <Radio className="w-5 h-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">{liveInspections.length}</p>
                  <p className="text-xs lg:text-sm text-gray-500">Active Now</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-2.5 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.pendingReview}</p>
                  <p className="text-xs lg:text-sm text-gray-500">Pending Review</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2.5 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.approvedToday}</p>
                  <p className="text-xs lg:text-sm text-gray-500">Approved Today</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2.5 rounded-lg">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.activeTechnicians}</p>
                  <p className="text-xs lg:text-sm text-gray-500">Technicians</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${stats.pendingOverrides > 0 ? "bg-orange-100" : "bg-gray-100"}`}>
                  <AlertTriangle className={`w-5 h-5 ${stats.pendingOverrides > 0 ? "text-orange-600" : "text-gray-400"}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.pendingOverrides}</p>
                  <p className="text-xs lg:text-sm text-gray-500">Overrides</p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2.5 rounded-lg">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.todayBookings}</p>
                  <p className="text-xs lg:text-sm text-gray-500">Bookings Today</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2.5 rounded-lg">
                  <Activity className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">{"$"}{stats.totalPaidRevenue.toLocaleString()}</p>
                  <p className="text-xs lg:text-sm text-gray-500">Paid Revenue</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${stats.pendingSubmissions > 0 ? "bg-amber-100" : "bg-gray-100"}`}>
                  <Phone className={`w-5 h-5 ${stats.pendingSubmissions > 0 ? "text-amber-600" : "text-gray-400"}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.pendingSubmissions}</p>
                  <p className="text-xs lg:text-sm text-gray-500">Pending Contacts</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2.5 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.totalChats}</p>
                  <p className="text-xs lg:text-sm text-gray-500">Chat Sessions</p>
                </div>
              </div>
            </div>
          </div>
        </>)}

        {/* Tab Navigation - Enhanced for desktop */}
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-1 lg:gap-0 border-b border-gray-200 min-w-max">
            {([
              { id: "live" as const, icon: Radio, label: "Live", badge: liveInspections.length > 0 ? liveInspections.length : undefined, badgeColor: "bg-green-500" },
              { id: "ops" as const, icon: Shield, label: "Ops" },
              { id: "review" as const, icon: FileText, label: "Review", badge: stats && stats.pendingReview > 0 ? stats.pendingReview : undefined, badgeColor: "bg-yellow-500" },
              { id: "jobs" as const, icon: Briefcase, label: "Jobs" },
              { id: "leads" as const, icon: Zap, label: "Leads" },
              { id: "analytics" as const, icon: Activity, label: "Analytics" },
              { id: "users" as const, icon: User, label: "Users" },
              { id: "bookings" as const, icon: Phone, label: "Bookings" },
              { id: "chats" as const, icon: MessageSquare, label: "Chats" },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 lg:px-5 py-2.5 lg:py-3 font-medium border-b-2 transition-all whitespace-nowrap text-sm lg:text-base ${
                  activeTab === tab.id
                    ? "text-blue-600 border-blue-600 bg-blue-50/50"
                    : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-1.5 lg:gap-2">
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
                  {tab.badge != null && (
                    <span className={`${tab.badgeColor || 'bg-blue-500'} text-white text-xs px-1.5 py-0.5 rounded-full`}>
                      {tab.badge}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Override Panel - Show if there are pending requests */}
        {stats && stats.pendingOverrides > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Override Requests
            </h2>
            <OverridePanel onRefresh={handleRefresh} />
          </section>
        )}

        {/* Live Operations Tab */}
        {activeTab === "live" && (
          <section>
            {liveInspections.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <Radio className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No active inspections</p>
                <p className="text-sm text-gray-500 mt-1">Technicians will appear here when they start jobs</p>
              </div>
            ) : (
              <div className="space-y-4">
                {liveInspections.map((inspection) => (
                  <div
                    key={inspection.id}
                    className="bg-white rounded-xl shadow-sm overflow-hidden"
                  >
                    {/* Card Header */}
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() =>
                        setExpandedInspection(
                          expandedInspection === inspection.id ? null : inspection.id
                        )
                      }
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            {getStageIcon(inspection.currentStage)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">
                                {inspection.technician.name}
                              </h3>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                {inspection.currentStageLabel}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {inspection.job.propertyAddress}, {inspection.job.propertyCity}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Time gate indicator */}
                          {inspection.currentStage === "INSPECTING" && (
                            <div
                              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                inspection.meetsTimeMinimum
                                  ? "bg-green-100 text-green-700"
                                  : "bg-orange-100 text-orange-700"
                              }`}
                            >
                              <Timer className="w-3 h-3" />
                              {inspection.inspectionDurationMinutes}m
                              {!inspection.meetsTimeMinimum && " (< 15m)"}
                            </div>
                          )}
                          {expandedInspection === inspection.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{inspection.progressPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${inspection.progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Mini Stage Indicators */}
                      <div className="flex items-center gap-1 overflow-x-auto pb-1">
                        {inspection.stages.map((stage) => (
                          <div
                            key={stage.id}
                            className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium ${
                              stage.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : stage.status === "current"
                                ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300"
                                : "bg-gray-100 text-gray-400"
                            }`}
                            title={stage.label}
                          >
                            {stage.status === "completed" ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : stage.status === "current" ? (
                              <Zap className="w-3 h-3" />
                            ) : (
                              <span className="w-3 h-3 block" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedInspection === inspection.id && (
                      <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50">
                        {/* Quick Actions */}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOverride(inspection.id, "override_time_gate");
                            }}
                            disabled={processingOverride === inspection.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
                          >
                            <Timer className="w-4 h-4" />
                            Override Time Gate
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOverride(inspection.id, "skip_signature");
                            }}
                            disabled={processingOverride === inspection.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
                          >
                            <PenTool className="w-4 h-4" />
                            Skip Signature
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOverride(inspection.id, "force_stage", "SUBMITTED");
                            }}
                            disabled={processingOverride === inspection.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            <SkipForward className="w-4 h-4" />
                            Force Submit
                          </button>
                          {inspection.technician.phone && (
                            <a
                              href={`tel:${inspection.technician.phone}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="w-4 h-4" />
                              Call Tech
                            </a>
                          )}
                        </div>

                        {/* Location Info */}
                        {inspection.location && (
                          <div className="bg-white rounded-lg p-3">
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-blue-500" />
                              Last Known Location
                            </h4>
                            <div className="text-sm text-gray-600">
                              <p>
                                Lat: {inspection.location.latitude.toFixed(6)}, Lng:{" "}
                                {inspection.location.longitude.toFixed(6)}
                              </p>
                              <p>
                                Event: {inspection.location.eventType} •{" "}
                                {formatDistanceToNow(new Date(inspection.location.timestamp), {
                                  addSuffix: true,
                                })}
                              </p>
                              {inspection.location.accuracy && (
                                <p>Accuracy: {Math.round(inspection.location.accuracy)}m</p>
                              )}
                              <a
                                href={`https://www.google.com/maps?q=${inspection.location.latitude},${inspection.location.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline inline-flex items-center gap-1 mt-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View on Map <ChevronRight className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Technician & Job Info */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg p-3">
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                              <User className="w-4 h-4 text-purple-500" />
                              Technician
                            </h4>
                            <div className="text-sm text-gray-600">
                              <p className="font-medium">{inspection.technician.name}</p>
                              <p>{inspection.technician.email}</p>
                              {inspection.technician.phone && (
                                <p>{inspection.technician.phone}</p>
                              )}
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-3">
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-green-500" />
                              Job Details
                            </h4>
                            <div className="text-sm text-gray-600">
                              <p className="font-medium">{inspection.job.jobNumber}</p>
                              <p>Client: {inspection.job.clientName}</p>
                              <p>Role: {inspection.job.clientRole}</p>
                              <p>Access: {inspection.job.accessType}</p>
                            </div>
                          </div>
                        </div>

                        {/* Time Tracking */}
                        <div className="bg-white rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-yellow-500" />
                            Time Tracking
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500">Started</p>
                              <p className="font-medium">
                                {inspection.startedAt
                                  ? format(new Date(inspection.startedAt), "h:mm a")
                                  : "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Arrived</p>
                              <p className="font-medium">
                                {inspection.arrivedAt
                                  ? format(new Date(inspection.arrivedAt), "h:mm a")
                                  : "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Camera Start</p>
                              <p className="font-medium">
                                {inspection.inspectionStartedAt
                                  ? format(new Date(inspection.inspectionStartedAt), "h:mm a")
                                  : "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Duration</p>
                              <p
                                className={`font-medium ${
                                  inspection.meetsTimeMinimum ? "text-green-600" : "text-orange-600"
                                }`}
                              >
                                {inspection.inspectionDurationMinutes}m
                                {!inspection.meetsTimeMinimum && " (min 15m)"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Collected Data */}
                        <div className="bg-white rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-500" />
                            Collected Data
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500">Client Confirmed</p>
                              <p className="font-medium">
                                {inspection.collectedData.confirmedClientName || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Home Age</p>
                              <p className="font-medium">
                                {inspection.collectedData.homeAge || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Pipe Material</p>
                              <p className="font-medium">
                                {inspection.collectedData.pipeMaterial || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Condition</p>
                              <p
                                className={`font-medium px-2 py-0.5 rounded inline-block ${
                                  getConditionColor(inspection.collectedData.overallCondition)
                                }`}
                              >
                                {inspection.collectedData.overallCondition?.replace("_", " ") || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Urgency</p>
                              <p className="font-medium">
                                {inspection.collectedData.urgencyLevel || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Pipe Rating</p>
                              <p className="font-medium">
                                {inspection.collectedData.pipeConditionRating || "—"}/10
                              </p>
                            </div>
                          </div>
                          {inspection.collectedData.recommendations && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-gray-500 text-sm">Recommendations</p>
                              <p className="text-sm">{inspection.collectedData.recommendations}</p>
                            </div>
                          )}
                        </div>

                        {/* Attachments */}
                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Camera className="w-4 h-4 text-gray-500" />
                            <span>{inspection.photoCount} Photos</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mic className="w-4 h-4 text-gray-500" />
                            <span>{inspection.voiceNoteCount} Voice Notes</span>
                          </div>
                          {inspection.video && (
                            <div className="flex items-center gap-2 text-sm">
                              <Video className="w-4 h-4 text-gray-500" />
                              <span>
                                Video: {inspection.video.uploadStatus}
                                {inspection.video.uploadProgress !== null &&
                                  inspection.video.uploadProgress < 100 &&
                                  ` (${inspection.video.uploadProgress}%)`}
                              </span>
                            </div>
                          )}
                          {inspection.signature && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <PenTool className="w-4 h-4" />
                              <span>Signed by {inspection.signature.signerName}</span>
                            </div>
                          )}
                        </div>

                        {/* Force Stage Buttons */}
                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-500 mb-2">Force to Stage:</p>
                          <div className="flex flex-wrap gap-2">
                            {inspection.stages.map((stage) => (
                              <button
                                key={stage.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOverride(inspection.id, "force_stage", stage.id);
                                }}
                                disabled={
                                  processingOverride === inspection.id ||
                                  stage.id === inspection.currentStage
                                }
                                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                  stage.id === inspection.currentStage
                                    ? "bg-blue-100 text-blue-700 cursor-default"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                } disabled:opacity-50`}
                              >
                                {stage.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Ops Monitor Tab */}
        {activeTab === "ops" && (
          <section>
            <OpsMonitorTab />
          </section>
        )}

        {/* Review Queue Tab */}
        {activeTab === "review" && (
          <section>
            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    filter === status
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {status.replace("_", " ")}
                </button>
              ))}
            </div>

            {/* Inspections List */}
            {reviewInspections.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No inspections found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviewInspections.map((inspection) => (
                  <div
                    key={inspection.id}
                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/admin/inspection/${inspection.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {inspection.inspectionNumber}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              inspection.status
                            )}`}
                          >
                            {inspection.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <User className="w-3 h-3" />
                          {inspection.technician.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-medium px-2 py-0.5 rounded ${
                            getConditionColor(inspection.overallCondition)
                          }`}
                        >
                          {inspection.overallCondition?.replace("_", " ") || "N/A"}
                        </p>
                        {inspection.urgencyLevel === "IMMEDIATE" && (
                          <span className="inline-flex items-center gap-1 text-red-600 text-xs">
                            <AlertTriangle className="w-3 h-3" /> Urgent
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p>{inspection.job.propertyAddress}</p>
                        <p className="text-gray-500">Client: {inspection.job.clientName}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        {inspection.videoAttachment?.uploadStatus === "COMPLETED" && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Video className="w-4 h-4" /> Video
                          </span>
                        )}
                        {inspection.clientSignature && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" /> Signed
                          </span>
                        )}
                        {inspection.completedAt && (
                          <span className="flex items-center gap-1 text-gray-500">
                            <Clock className="w-4 h-4" />
                            {formatDistanceToNow(new Date(inspection.completedAt), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-blue-600 font-medium">
                        <Eye className="w-4 h-4" />
                        Review
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
          <section>
            <JobManagement
              currentUserRole={user?.role as "ADMIN" | "OWNER" | "SUPER_ADMIN"}
            />
          </section>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User Management</h2>
            <UserManagement
              currentUserRole={user?.role as "ADMIN" | "OWNER" | "SUPER_ADMIN"}
            />
          </section>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Bookings & Submissions</h2>
            <BookingsTab />
          </section>
        )}

        {/* Chats Tab */}
        {activeTab === "chats" && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Chat Transcripts</h2>
            <ChatsTab />
          </section>
        )}

        {/* Leads Tab */}
        {activeTab === "leads" && (
          <section>
            <LeadsTab />
          </section>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <section>
            <AnalyticsTab />
          </section>
        )}
      </main>
    </div>
  );
}

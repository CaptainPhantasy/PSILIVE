"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";
import {
  Loader2,
  LogOut,
  MapPin,
  Clock,
  Phone,
  ChevronRight,
  Calendar,
  RefreshCw,
  MessageSquare,
  User,
  AlertTriangle,
  CheckCircle,
  History,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface Job {
  id: string;
  jobNumber: string;
  clientName: string;
  clientPhone: string | null;
  clientRole: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyZip: string;
  scheduledDate: string;
  scheduledTime: string | null;
  accessType: string;
  hasCrawlSpace: boolean;
  specialNotes: string | null;
  totalPrice: number;
  status: string;
  inspection: {
    id: string;
    currentStage: string;
    status: string;
    reviewNotes?: string | null;
    reviewedAt?: string | null;
  } | null;
}

export default function TechnicianDashboard() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [rejectedJobs, setRejectedJobs] = useState<Job[]>([]);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/technician/login");
    } else if (!loading && user && !["TECHNICIAN", "ADMIN", "OWNER", "SUPER_ADMIN"].includes(user.role)) {
      router.push("/technician/login");
    }
  }, [user, loading, router]);

  const fetchJobs = async (includeCompleted = false) => {
    try {
      const url = includeCompleted 
        ? "/api/technician/jobs?includeCompleted=true"
        : "/api/technician/jobs";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs || []);
        setRejectedJobs(data.rejectedJobs || []);
        if (data.completedJobs) {
          setCompletedJobs(data.completedJobs);
        }
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoadingJobs(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchJobs(showCompleted);
    }
  }, [user, showCompleted]);

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
    fetchJobs(showCompleted);
  };

  const handleJobClick = (job: Job) => {
    if (job.inspection) {
      router.push(`/technician/inspection/${job.inspection.id}`);
    } else {
      router.push(`/technician/job/${job.id}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/technician/login");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return "bg-yellow-100 text-yellow-800";
      case "ACCEPTED":
        return "bg-blue-100 text-blue-800";
      case "EN_ROUTE":
        return "bg-purple-100 text-purple-800";
      case "ON_SITE":
      case "IN_PROGRESS":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAccessTypeLabel = (type: string) => {
    switch (type) {
      case "CLEANOUT":
        return "Cleanout";
      case "ROOF_VENT":
        return "Roof Vent";
      case "TOILET_PULL":
        return "Toilet Pull";
      default:
        return "TBD";
    }
  };

  if (loading || loadingJobs) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const todayJobs = jobs.filter((job) => {
    const jobDate = new Date(job.scheduledDate);
    const today = new Date();
    return jobDate.toDateString() === today.toDateString();
  });

  const upcomingJobs = jobs.filter((job) => {
    const jobDate = new Date(job.scheduledDate);
    const today = new Date();
    return jobDate.toDateString() !== today.toDateString();
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-blue-600 text-white px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 bg-white rounded-full">
              <Image
                src="/logo.png"
                alt="PSI"
                fill
                className="object-contain p-1"
              />
            </div>
            <div>
              <h1 className="font-semibold">PSI Field App</h1>
              <p className="text-sm text-blue-200">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/technician/messages")}
              className="relative p-2 hover:bg-blue-700 rounded-full transition-colors"
              title="Messages"
            >
              <MessageSquare className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-blue-600">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => router.push("/technician/profile")}
              className="p-2 hover:bg-blue-700 rounded-full transition-colors"
              title="Profile"
            >
              <User className="w-5 h-5" />
            </button>
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-blue-700 rounded-full transition-colors"
              disabled={refreshing}
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-blue-700 rounded-full transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        {/* Needs Attention - Rejected Inspections */}
        {rejectedJobs.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Needs Attention ({rejectedJobs.length})
            </h2>
            <div className="space-y-3">
              {rejectedJobs.map((job) => (
                <RejectedJobCard
                  key={job.id}
                  job={job}
                  onClick={() => handleJobClick(job)}
                  getAccessTypeLabel={getAccessTypeLabel}
                />
              ))}
            </div>
          </section>
        )}

        {/* Today's Jobs */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Today&apos;s Jobs ({todayJobs.length})
          </h2>

          {todayJobs.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center text-gray-500">
              No jobs scheduled for today
            </div>
          ) : (
            <div className="space-y-3">
              {todayJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onClick={() => handleJobClick(job)}
                  getStatusColor={getStatusColor}
                  getAccessTypeLabel={getAccessTypeLabel}
                />
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Jobs */}
        {upcomingJobs.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              Upcoming ({upcomingJobs.length})
            </h2>
            <div className="space-y-3">
              {upcomingJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onClick={() => handleJobClick(job)}
                  getStatusColor={getStatusColor}
                  getAccessTypeLabel={getAccessTypeLabel}
                  isUpcoming
                />
              ))}
            </div>
          </section>
        )}

        {/* Completed Jobs Toggle */}
        <section>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-sm mb-3"
          >
            <div className="flex items-center gap-2 text-gray-700">
              <History className="w-5 h-5" />
              <span className="font-medium">Completed Jobs</span>
            </div>
            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showCompleted ? "rotate-90" : ""}`} />
          </button>

          {showCompleted && (
            <div className="space-y-3">
              {completedJobs.length === 0 ? (
                <div className="bg-white rounded-xl p-6 text-center text-gray-500">
                  No completed jobs yet
                </div>
              ) : (
                completedJobs.map((job) => (
                  <CompletedJobCard
                    key={job.id}
                    job={job}
                    onClick={() => handleJobClick(job)}
                    getAccessTypeLabel={getAccessTypeLabel}
                  />
                ))
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function JobCard({
  job,
  onClick,
  getStatusColor,
  getAccessTypeLabel,
  isUpcoming = false,
}: {
  job: Job;
  onClick: () => void;
  getStatusColor: (status: string) => string;
  getAccessTypeLabel: (type: string) => string;
  isUpcoming?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-900">{job.clientName}</p>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <User className="w-3 h-3" />
            {job.clientRole.replace("_", " ")}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
          {job.status.replace("_", " ")}
        </span>
      </div>

      <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>
          {job.propertyAddress}, {job.propertyCity}, {job.propertyState} {job.propertyZip}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-gray-600">
            <Clock className="w-4 h-4" />
            {isUpcoming
              ? format(new Date(job.scheduledDate), "MMM d")
              : job.scheduledTime || "Flexible"}
          </span>
          {job.clientPhone && (
            <a
              href={`tel:${job.clientPhone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-blue-600"
            >
              <Phone className="w-4 h-4" />
              Call
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {getAccessTypeLabel(job.accessType)}
          </span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {job.specialNotes && (
        <p className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
          Note: {job.specialNotes}
        </p>
      )}
    </button>
  );
}

// Rejected Job Card - Red alert styling
function RejectedJobCard({
  job,
  onClick,
  getAccessTypeLabel,
}: {
  job: Job;
  onClick: () => void;
  getAccessTypeLabel: (type: string) => string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-red-50 border-2 border-red-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-red-300 transition-all text-left"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-900">{job.clientName}</p>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <User className="w-3 h-3" />
            {job.clientRole.replace("_", " ")}
          </p>
        </div>
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          REJECTED
        </span>
      </div>

      {/* Rejection reason */}
      {job.inspection?.reviewNotes && (
        <div className="mb-3 p-2 bg-red-100 rounded-lg">
          <p className="text-xs font-medium text-red-800 mb-1">Rejection Reason:</p>
          <p className="text-sm text-red-700">{job.inspection.reviewNotes}</p>
          {job.inspection.reviewedAt && (
            <p className="text-xs text-red-600 mt-1">
              {formatDistanceToNow(new Date(job.inspection.reviewedAt), { addSuffix: true })}
            </p>
          )}
        </div>
      )}

      <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>
          {job.propertyAddress}, {job.propertyCity}, {job.propertyState} {job.propertyZip}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-gray-600">
            <Clock className="w-4 h-4" />
            {format(new Date(job.scheduledDate), "MMM d")}
          </span>
          {job.clientPhone && (
            <a
              href={`tel:${job.clientPhone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-blue-600"
            >
              <Phone className="w-4 h-4" />
              Call
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {getAccessTypeLabel(job.accessType)}
          </span>
          <ChevronRight className="w-5 h-5 text-red-400" />
        </div>
      </div>

      <p className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded font-medium">
        ⚠️ Tap to review and resubmit
      </p>
    </button>
  );
}

// Completed Job Card - Muted styling
function CompletedJobCard({
  job,
  onClick,
  getAccessTypeLabel,
}: {
  job: Job;
  onClick: () => void;
  getAccessTypeLabel: (type: string) => string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-gray-50 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left opacity-80"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-700">{job.clientName}</p>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <User className="w-3 h-3" />
            {job.clientRole.replace("_", " ")}
          </p>
        </div>
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          {job.inspection?.status === "DELIVERED" ? "DELIVERED" : "APPROVED"}
        </span>
      </div>

      <div className="flex items-start gap-2 text-sm text-gray-500 mb-2">
        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>
          {job.propertyAddress}, {job.propertyCity}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1 text-gray-500">
          <Clock className="w-4 h-4" />
          {format(new Date(job.scheduledDate), "MMM d, yyyy")}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-gray-200 px-2 py-1 rounded">
            {getAccessTypeLabel(job.accessType)}
          </span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </button>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  Loader2,
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  Mail,
  User,
  DollarSign,
  Navigation,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

interface Job {
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
  hasCrawlSpace: boolean;
  specialNotes: string | null;
  basePrice: number;
  accessFee: number;
  totalPrice: number;
  status: string;
}

export default function JobDetailsPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const router = useRouter();
  const { user, loading } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/technician/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch("/api/technician/jobs");
        const data = await res.json();
        if (data.success) {
          const foundJob = data.jobs.find((j: Job) => j.id === jobId);
          setJob(foundJob || null);
        }
      } catch (error) {
        console.error("Failed to fetch job:", error);
      } finally {
        setLoadingJob(false);
      }
    };

    if (user) {
      fetchJob();
    }
  }, [user, jobId]);

  const handleAcceptJob = async () => {
    setAccepting(true);
    setError("");

    try {
      const res = await fetch(`/api/technician/jobs/${jobId}/accept`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/technician/inspection/${data.inspection.id}`);
      } else {
        setError(data.error || "Failed to accept job");
      }
    } catch {
      setError("Network error");
    } finally {
      setAccepting(false);
    }
  };

  const openMaps = () => {
    if (job) {
      const address = encodeURIComponent(
        `${job.propertyAddress}, ${job.propertyCity}, ${job.propertyState} ${job.propertyZip}`
      );
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, "_blank");
    }
  };

  if (loading || loadingJob) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-600 mb-4">Job not found</p>
        <button
          onClick={() => router.push("/technician/dashboard")}
          className="text-blue-600 hover:underline"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const getAccessTypeLabel = (type: string) => {
    switch (type) {
      case "CLEANOUT":
        return "Standard Cleanout";
      case "ROOF_VENT":
        return "Roof Vent (+$50)";
      case "TOILET_PULL":
        return "Toilet Pull & Reset (+$65)";
      default:
        return "To Be Determined";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="bg-blue-600 text-white px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/technician/dashboard")}
            className="p-1 hover:bg-blue-700 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="font-semibold">Job Details</h1>
            <p className="text-sm text-blue-200">{job.jobNumber}</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Client Info */}
        <section className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">Client Information</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium">{job.clientName}</p>
                <p className="text-sm text-gray-500">{job.clientRole.replace("_", " ")}</p>
              </div>
            </div>
            {job.clientPhone && (
              <a
                href={`tel:${job.clientPhone}`}
                className="flex items-center gap-3 text-blue-600"
              >
                <Phone className="w-5 h-5" />
                <span>{job.clientPhone}</span>
              </a>
            )}
            <a
              href={`mailto:${job.clientEmail}`}
              className="flex items-center gap-3 text-blue-600"
            >
              <Mail className="w-5 h-5" />
              <span className="text-sm">{job.clientEmail}</span>
            </a>
          </div>
        </section>

        {/* Property Info */}
        <section className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">Property</h2>
          <button
            onClick={openMaps}
            className="flex items-start gap-3 text-left w-full"
          >
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">{job.propertyAddress}</p>
              <p className="text-sm text-gray-500">
                {job.propertyCity}, {job.propertyState} {job.propertyZip}
              </p>
            </div>
            <Navigation className="w-5 h-5 text-blue-600" />
          </button>
        </section>

        {/* Schedule Info */}
        <section className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">Schedule</h2>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium">
                {format(new Date(job.scheduledDate), "EEEE, MMMM d, yyyy")}
              </p>
              <p className="text-sm text-gray-500">{job.scheduledTime || "Flexible timing"}</p>
            </div>
          </div>
        </section>

        {/* Access & Pricing */}
        <section className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">Access & Pricing</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Access Type</span>
              <span className="font-medium">{getAccessTypeLabel(job.accessType)}</span>
            </div>
            {job.hasCrawlSpace && (
              <div className="flex justify-between">
                <span className="text-gray-600">Crawl Space</span>
                <span className="font-medium text-orange-600">Yes (+$30)</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2 flex justify-between">
              <span className="text-gray-600 flex items-center gap-1">
                <DollarSign className="w-4 h-4" /> Total
              </span>
              <span className="font-bold text-lg">${job.totalPrice}</span>
            </div>
          </div>
        </section>

        {/* Special Notes */}
        {job.specialNotes && (
          <section className="bg-orange-50 rounded-xl p-4 border border-orange-200">
            <h2 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Special Notes
            </h2>
            <p className="text-orange-700">{job.specialNotes}</p>
          </section>
        )}
      </main>

      {/* Fixed Bottom Action */}
      {job.status === "ASSIGNED" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          <button
            onClick={handleAcceptJob}
            disabled={accepting}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {accepting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Accept Job
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

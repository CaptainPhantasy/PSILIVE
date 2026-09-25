"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  MapPin,
  Calendar,
  Download,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { T } from "@/components/diversity/diversity-provider";

interface StatusStage {
  id: string;
  label: string;
  description: string;
  status: "completed" | "current" | "pending";
}

interface StatusInfo {
  stages: StatusStage[];
  currentStageIndex: number;
  message: string;
  downloadAvailable: boolean;
  downloadExpires: string | null;
  inspectionId: string | null;
}

interface JobInfo {
  jobNumber: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  scheduledDate: string;
  scheduledTime: string | null;
}

export default function StatusPage() {
  const [jobNumber, setJobNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<StatusInfo | null>(null);
  const [job, setJob] = useState<JobInfo | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setStatus(null);
    setJob(null);

    try {
      const res = await fetch(
        `/api/status/${jobNumber}?email=${encodeURIComponent(email)}`
      );
      const data = await res.json();

      if (data.success) {
        setStatus(data.status);
        setJob(data.job);
      } else {
        setError(data.error || "Failed to fetch status");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-12 h-12">
              <Image
                src="/logo.png"
                alt="Precision Sewer Inspection"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-bold text-gray-900 hidden sm:block">
              Precision Sewer Inspection
            </span>
          </Link>
          <Link
            href="/contact"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            <T>Contact Us</T>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <T>Check Your Inspection Status</T>
          </h1>
          <p className="text-gray-600">
            <T>Enter your job number and email to see the current status of your
            inspection.</T>
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <T>Job Number</T>
                </label>
                <input
                  type="text"
                  value={jobNumber}
                  onChange={(e) => setJobNumber(e.target.value.toUpperCase())}
                  placeholder="e.g., PSI-2026-001"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <T>Email Address</T>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !jobNumber || !email}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <T>Checking...</T>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <T>Check Status</T>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Status Display */}
        {status && job && (
          <div className="space-y-6">
            {/* Job Info Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500"><T>Job Number</T></p>
                  <p className="text-xl font-bold text-gray-900">
                    {job.jobNumber}
                  </p>
                </div>
                {status.downloadAvailable && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    <T>Report Ready</T>
                  </span>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500"><T>Property</T></p>
                    <p className="text-gray-900">
                      {job.propertyAddress}
                      <br />
                      {job.propertyCity}, {job.propertyState}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500"><T>Scheduled</T></p>
                    <p className="text-gray-900">
                      {format(new Date(job.scheduledDate), "MMMM d, yyyy")}
                      {job.scheduledTime && (
                        <>
                          <br />
                          {job.scheduledTime}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Message */}
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <p className="text-blue-800 text-lg">{status.message}</p>
              {status.downloadExpires && (
                <p className="text-blue-600 text-sm mt-2">
                  <T>Download link expires:</T>{" "}
                  {format(
                    new Date(status.downloadExpires),
                    "MMMM d, yyyy 'at' h:mm a"
                  )}
                </p>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                <T>Inspection Progress</T>
              </h2>
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gray-200" />
                <div
                  className="absolute left-4 top-8 w-0.5 bg-blue-500 transition-all duration-500"
                  style={{
                    height: `${(status.currentStageIndex / (status.stages.length - 1)) * 100}%`,
                    maxHeight: "calc(100% - 64px)",
                  }}
                />

                <div className="space-y-6">
                  {status.stages.map((stage, index) => (
                    <div key={stage.id} className="flex items-start gap-4">
                      <div
                        className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          stage.status === "completed"
                            ? "bg-blue-500 text-white"
                            : stage.status === "current"
                            ? "bg-blue-500 text-white ring-4 ring-blue-100"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        {stage.status === "completed" ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : stage.status === "current" ? (
                          <Clock className="w-5 h-5" />
                        ) : (
                          <span className="text-sm">{index + 1}</span>
                        )}
                      </div>
                      <div className="pt-1">
                        <p
                          className={`font-medium ${
                            stage.status === "pending"
                              ? "text-gray-400"
                              : "text-gray-900"
                          }`}
                        >
                          {stage.label}
                        </p>
                        <p className="text-sm text-gray-500">
                          {stage.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Download Button */}
            {status.downloadAvailable && status.inspectionId && (
              <Link
                href={`/download/${status.inspectionId}`}
                className="block w-full py-4 bg-green-600 text-white rounded-2xl font-semibold text-center hover:bg-green-700 transition-colors shadow-lg"
              >
                <span className="flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" />
                  <T>Access Your Inspection Report</T>
                  <ArrowRight className="w-5 h-5" />
                </span>
              </Link>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p><T>Can&apos;t find your job number?</T></p>
          <p>
            <T>Check your confirmation email or</T>{" "}
            <Link href="/contact" className="text-blue-600 hover:underline">
              <T>contact us</T>
            </Link>{" "}
            <T>for assistance.</T>
          </p>
        </div>
      </main>
    </div>
  );
}

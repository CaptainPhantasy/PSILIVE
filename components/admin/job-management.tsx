"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Briefcase,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Loader2,
  Calendar,
  MapPin,
  User,
  Mail,
  Phone,
  Clock,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface Job {
  id: string;
  jobNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyZip: string;
  scheduledDate: string;
  scheduledTime: string | null;
  accessType: string;
  specialNotes: string | null;
  status: string;
  technicianId: string | null;
  technician: {
    id: string;
    name: string;
    email: string;
  } | null;
  inspection: {
    id: string;
    inspectionNumber: string;
    status: string;
    currentStage: string;
  } | null;
  createdAt: string;
}

interface Technician {
	id: string;
	name: string;
	email: string;
	role: string;
}

interface JobManagementProps {
  currentUserRole: string;
}

export function JobManagement({ currentUserRole }: JobManagementProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/jobs?status=${filter}&limit=100`);
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchTechnicians = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setTechnicians(data.users.filter((u: { isActive: boolean; role: string }) =>
          u.isActive && ["TECHNICIAN", "OWNER", "SUPER_ADMIN"].includes(u.role)
        ));
      }
    } catch (error) {
      console.error("Failed to fetch technicians:", error);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchTechnicians();
  }, [fetchJobs, fetchTechnicians]);

  const filteredJobs = jobs.filter((job) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      job.jobNumber.toLowerCase().includes(query) ||
      job.clientName.toLowerCase().includes(query) ||
      job.clientEmail.toLowerCase().includes(query) ||
      job.propertyAddress.toLowerCase().includes(query)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-purple-100 text-purple-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleCreateJob = async (formData: Record<string, string | null>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Job ${data.job.jobNumber} created!`);
        setShowCreateModal(false);
        fetchJobs();
      } else {
        toast.error(data.error || "Failed to create job");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateJob = async (jobId: string, formData: Record<string, string | null>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Job updated!");
        setShowEditModal(false);
        setSelectedJob(null);
        fetchJobs();
      } else {
        toast.error(data.error || "Failed to update job");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job? This cannot be undone.")) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Job deleted");
        fetchJobs();
      } else {
        toast.error(data.error || "Failed to delete job");
      }
    } catch {
      toast.error("Network error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Job Management</h2>
          <span className="text-sm text-gray-500">({filteredJobs.length} jobs)</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            <Plus className="w-4 h-4" /> Create Job
          </button>
          <button
            onClick={() => fetchJobs()}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by job #, name, email, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg text-sm bg-white"
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Jobs List */}
      <div className="space-y-3">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No jobs found
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono font-semibold text-blue-600">
                      {job.jobNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status.replace("_", " ")}
                    </span>
                    {job.inspection && (
                      <span className="text-xs text-gray-500">
                        Inspection: {job.inspection.currentStage}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{job.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{job.clientEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">
                        {job.propertyAddress}, {job.propertyCity}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(job.scheduledDate), "MMM d, yyyy")}
                        {job.scheduledTime && ` at ${job.scheduledTime}`}
                      </span>
                    </div>
                  </div>
                  {job.technician && (
                    <div className="text-sm text-gray-500">
                      Assigned to: <span className="font-medium">{job.technician.name}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedJob(job);
                      setShowEditModal(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Edit Job"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {currentUserRole === "SUPER_ADMIN" && !job.inspection && (
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete Job"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Job Modal */}
      {showCreateModal && (
        <JobFormModal
          title="Create Job"
          technicians={technicians}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateJob}
          saving={saving}
        />
      )}

      {/* Edit Job Modal */}
      {showEditModal && selectedJob && (
        <JobFormModal
          title="Edit Job"
          job={selectedJob}
          technicians={technicians}
          onClose={() => {
            setShowEditModal(false);
            setSelectedJob(null);
          }}
          onSubmit={(data) => handleUpdateJob(selectedJob.id, data)}
          saving={saving}
        />
      )}
    </div>
  );
}

// Job Form Modal Component
function JobFormModal({
  title,
  job,
  technicians,
  onClose,
  onSubmit,
  saving,
}: {
  title: string;
  job?: Job;
  technicians: Technician[];
  onClose: () => void;
  onSubmit: (data: Record<string, string | null>) => void;
  saving: boolean;
}) {
  const [formData, setFormData] = useState({
    clientName: job?.clientName || "",
    clientEmail: job?.clientEmail || "",
    clientPhone: job?.clientPhone || "",
    propertyAddress: job?.propertyAddress || "",
    propertyCity: job?.propertyCity || "Indianapolis",
    propertyState: job?.propertyState || "IN",
    propertyZip: job?.propertyZip || "",
    scheduledDate: job ? format(new Date(job.scheduledDate), "yyyy-MM-dd") : "",
    scheduledTime: job?.scheduledTime || "",
    accessType: job?.accessType || "CLEANOUT",
    specialNotes: job?.specialNotes || "",
    technicianId: job?.technicianId || "",
    status: job?.status || "PENDING",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: Record<string, string | null> = { ...formData };
    if (!submitData.technicianId) submitData.technicianId = null;
    if (!submitData.clientPhone) submitData.clientPhone = null;
    if (!submitData.scheduledTime) submitData.scheduledTime = null;
    if (!submitData.specialNotes) submitData.specialNotes = null;
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Info */}
          <div className="border-b pb-4">
            <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" /> Client Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Client Email *</label>
                <input
                  type="email"
                  required
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Client Phone</label>
                <input
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Property Info */}
          <div className="border-b pb-4">
            <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Property Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  value={formData.propertyAddress}
                  onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">City</label>
                <input
                  type="text"
                  value={formData.propertyCity}
                  onChange={(e) => setFormData({ ...formData, propertyCity: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.propertyState}
                    onChange={(e) => setFormData({ ...formData, propertyState: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">ZIP *</label>
                  <input
                    type="text"
                    required
                    value={formData.propertyZip}
                    onChange={(e) => setFormData({ ...formData, propertyZip: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Schedule & Assignment */}
          <div className="border-b pb-4">
            <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Schedule & Assignment
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Scheduled Date *</label>
                <input
                  type="date"
                  required
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Scheduled Time</label>
                <input
                  type="text"
                  placeholder="e.g., 9:00 AM - 11:30 AM"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Access Type</label>
                <select
                  value={formData.accessType}
                  onChange={(e) => setFormData({ ...formData, accessType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="CLEANOUT">Cleanout</option>
                  <option value="TOILET_PULL">Toilet Pull</option>
                  <option value="ROOF_VENT">Roof Vent</option>
                  <option value="CRAWLSPACE">Crawlspace</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Assign Technician</label>
                <select
                  value={formData.technicianId}
                  onChange={(e) => setFormData({ ...formData, technicianId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="">-- Unassigned --</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name} ({tech.role.replace("_", " ")})
                    </option>
                  ))}
                </select>
              </div>
              {job && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Special Notes</label>
            <textarea
              rows={3}
              value={formData.specialNotes}
              onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
              placeholder="Gate code, access instructions, etc."
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : job ? (
                <><CheckCircle className="w-4 h-4" /> Save Changes</>
              ) : (
                <><Plus className="w-4 h-4" /> Create Job</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

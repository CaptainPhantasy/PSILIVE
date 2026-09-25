"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  User,
  UserPlus,
  Edit2,
  Trash2,
  Check,
  X,
  Shield,
  AlertCircle,
  Phone,
  Mail,
  Award,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

interface UserData {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: "TECHNICIAN" | "MANAGER" | "ADMIN" | "OWNER" | "SUPER_ADMIN";
  isActive: boolean;
  certifications: string[];
  createdAt: string;
  _count: {
    inspections: number;
    assignedJobs: number;
  };
}

interface Props {
  currentUserRole: "ADMIN" | "OWNER" | "SUPER_ADMIN";
}

export function UserManagement({ currentUserRole }: Props) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const fetchUsers = useCallback(async () => {
    try {
      let url = "/api/admin/users";
      if (filter === "technicians") url += "?role=TECHNICIAN";
      if (filter === "managers") url += "?role=MANAGER";
      if (filter === "admins") url += "?role=ADMIN";
      if (filter === "owners") url += "?role=OWNER";
      if (filter === "inactive") url += "?active=false";

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRefresh = () => {
    setLoading(true);
    fetchUsers();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-purple-100 text-purple-800";
      case "OWNER":
        return "bg-indigo-100 text-indigo-800";
      case "ADMIN":
        return "bg-blue-100 text-blue-800";
      case "MANAGER":
        return "bg-teal-100 text-teal-800";
      default:
        return "bg-gray-100 text-gray-800";
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Users</option>
            <option value="technicians">Technicians</option>
            <option value="managers">Managers</option>
            <option value="admins">Admins</option>
            <option value="owners">Owners</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* User List */}
      <div className="space-y-3">
        {users.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No users found</p>
          </div>
        ) : (
          users.map((u) => (
            <div
              key={u.id}
              className={`bg-white rounded-xl p-4 shadow-sm ${
                !u.isActive ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="bg-gray-100 p-3 rounded-full">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{u.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(
                          u.role
                        )}`}
                      >
                        {u.role.replace("_", " ")}
                      </span>
                      {!u.isActive && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {u.email}
                      </span>
                      {u.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {u.phone}
                        </span>
                      )}
                    </div>
                    {u.certifications.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <Award className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-gray-500">
                          {u.certifications.join(", ")}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>{u._count.inspections} inspections</span>
                      <span>{u._count.assignedJobs} jobs</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingUser(u)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateUserModal
          currentUserRole={currentUserRole}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchUsers();
          }}
        />
      )}

      {/* Edit Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          currentUserRole={currentUserRole}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}

function CreateUserModal({
  currentUserRole,
  onClose,
  onSuccess,
}: {
  currentUserRole: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "TECHNICIAN",
    certifications: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
    	const payload = {
    		...formData,
    		password: formData.password || undefined,
    		certifications: formData.certifications
    			? formData.certifications.split(",").map((c) => c.trim())
    			: [],
    	};

    	const res = await fetch("/api/admin/users", {
    		method: "POST",
    		headers: { "Content-Type": "application/json" },
    		body: JSON.stringify(payload),
    	});

      const data = await res.json();
      if (data.success) {
        toast.success("User created successfully");
        onSuccess();
      } else {
        setError(data.error || "Failed to create user");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add New User</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
          	<label className="block text-sm font-medium text-gray-700 mb-1">
          		Initial Password
          	</label>
          	<input
          		type="password"
          		value={formData.password}
          		onChange={(e) =>
          			setFormData({ ...formData, password: e.target.value })
          		}
          		minLength={8}
          		placeholder="Leave blank to use this year's default"
          		className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          	/>
          	<p className="text-xs text-gray-500 mt-1">
          		Blank uses the configured default initial password. Users can change it from My Profile after logging in.
          	</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="TECHNICIAN">Technician</option>
              <option value="MANAGER">Manager</option>
              {(currentUserRole === "OWNER" || currentUserRole === "SUPER_ADMIN") && (
                <option value="ADMIN">Admin</option>
              )}
              {currentUserRole === "SUPER_ADMIN" && (
                <>
                  <option value="OWNER">Owner</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Certifications
            </label>
            <input
              type="text"
              value={formData.certifications}
              onChange={(e) =>
                setFormData({ ...formData, certifications: e.target.value })
              }
              placeholder="e.g., InterNACHI, ASHI"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Separate with commas</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({
  user,
  currentUserRole,
  onClose,
  onSuccess,
}: {
  user: UserData;
  currentUserRole: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: user.name,
    phone: user.phone || "",
    role: user.role,
    isActive: user.isActive,
    certifications: user.certifications.join(", "),
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const updateData: Record<string, unknown> = {
        name: formData.name,
        phone: formData.phone || null,
        role: formData.role,
        isActive: formData.isActive,
        certifications: formData.certifications
          ? formData.certifications.split(",").map((c) => c.trim())
          : [],
      };
      if (formData.password) {
        updateData.password = formData.password;
      }

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("User updated successfully");
        onSuccess();
      } else {
        setError(data.error || "Failed to update user");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          data.deactivated
            ? "User deactivated (has existing data)"
            : "User deleted"
        );
        onSuccess();
      } else {
        setError(data.error || "Failed to delete user");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const roleLevel: Record<string, number> = {
    TECHNICIAN: 1,
    MANAGER: 2,
    ADMIN: 3,
    OWNER: 4,
    SUPER_ADMIN: 5,
  };
  const canModifyRole =
    (roleLevel[currentUserRole] || 0) > (roleLevel[user.role] || 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
          <span className="text-sm text-gray-500">{user.email}</span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value as UserData["role"],
                })
              }
              disabled={!canModifyRole}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="TECHNICIAN">Technician</option>
              <option value="MANAGER">Manager</option>
              {(currentUserRole === "OWNER" || currentUserRole === "SUPER_ADMIN") && (
                <option value="ADMIN">Admin</option>
              )}
              {currentUserRole === "SUPER_ADMIN" && (
                <>
                  <option value="OWNER">Owner</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </>
              )}
            </select>
            {!canModifyRole && (
              <p className="text-xs text-gray-500 mt-1">
                You can only modify roles below your own level
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Certifications
            </label>
            <input
              type="text"
              value={formData.certifications}
              onChange={(e) =>
                setFormData({ ...formData, certifications: e.target.value })
              }
              placeholder="e.g., InterNACHI, ASHI"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Leave blank to keep current"
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Account Active
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>

          {canModifyRole && (
            <div className="pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="w-full px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete User
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

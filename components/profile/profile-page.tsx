"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/user-avatar";
import {
  Loader2,
  ArrowLeft,
  Camera,
  Save,
  User,
  Mail,
  Phone,
  Shield,
  FileText,
  CheckCircle,
  AlertCircle,
  Lock,
} from "lucide-react";
import Image from "next/image";

interface ProfileData {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  bio: string | null;
  profilePhotoPath: string | null;
  profilePhotoUrl: string | null;
  certifications: string[];
  createdAt: string;
}

interface ProfilePageProps {
  backPath: string;
}

export function ProfilePage({ backPath }: ProfilePageProps) {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editable fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push(backPath.includes("admin") ? "/admin" : "/technician/login");
    }
  }, [user, loading, router, backPath]);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (data.success) {
          setProfile(data.profile);
          setName(data.profile.name);
          setPhone(data.profile.phone || "");
          setBio(data.profile.bio || "");
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    }
    if (user) fetchProfile();
  }, [user]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select an image file" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image must be under 5MB" });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      // Get presigned URL
      const presignedRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: `profile-${Date.now()}.${file.name.split(".").pop()}`,
          contentType: file.type,
          isPublic: true,
        }),
      });
      const { uploadUrl, cloud_storage_path } = await presignedRes.json();

      // Check signed headers for Content-Disposition
      const url = new URL(uploadUrl);
      const signedHeaders = url.searchParams.get("X-Amz-SignedHeaders") || "";
      const headers: Record<string, string> = { "Content-Type": file.type };
      if (signedHeaders.includes("content-disposition")) {
        headers["Content-Disposition"] = "attachment";
      }

      // Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      // Get public URL
      const urlRes = await fetch("/api/upload/get-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cloud_storage_path, isPublic: true }),
      });
      const urlData = await urlRes.json();
      const photoUrl = urlData.fileUrl;

      // Update profile
      const updateRes = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profilePhotoPath: cloud_storage_path,
          profilePhotoUrl: photoUrl,
        }),
      });
      const updateData = await updateRes.json();
      if (updateData.success) {
        setProfile((prev) => prev ? { ...prev, profilePhotoPath: cloud_storage_path, profilePhotoUrl: photoUrl } : null);
        setMessage({ type: "success", text: "Photo updated!" });
        await refreshUser();
      }
    } catch (err) {
      console.error("Photo upload error:", err);
      setMessage({ type: "error", text: "Failed to upload photo" });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
  	setSaving(true);
  	setMessage(null);

  	const wantsPasswordChange = currentPassword || newPassword || confirmPassword;
  	if (wantsPasswordChange && newPassword !== confirmPassword) {
  		setSaving(false);
  		setMessage({ type: "error", text: "New passwords do not match" });
  		return;
  	}

  	try {
  		const payload: Record<string, unknown> = { name, phone: phone || null, bio: bio || null };
  		if (wantsPasswordChange) {
  			payload.currentPassword = currentPassword;
  			payload.newPassword = newPassword;
  		}

  		const res = await fetch("/api/profile", {
  			method: "PATCH",
  			headers: { "Content-Type": "application/json" },
  			body: JSON.stringify(payload),
  		});
  		const data = await res.json();
  		if (data.success) {
  			setProfile((prev) => prev ? { ...prev, name, phone, bio } : null);
  			setCurrentPassword("");
  			setNewPassword("");
  			setConfirmPassword("");
  			setMessage({ type: "success", text: wantsPasswordChange ? "Profile and password saved!" : "Profile saved!" });
  			await refreshUser();
  		} else {
  			setMessage({ type: "error", text: data.error || "Failed to save" });
  		}
  	} catch {
  		setMessage({ type: "error", text: "Network error" });
  	} finally {
  		setSaving(false);
  	}
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return "Super Admin";
      case "ADMIN": return "Administrator";
      case "TECHNICIAN": return "Technician";
      default: return role;
    }
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push(backPath)} className="p-1 hover:bg-blue-700 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <User className="w-5 h-5" />
        <h1 className="font-semibold">My Profile</h1>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Status Message */}
        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}>
            {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        {/* Avatar Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col items-center">
          <div className="relative">
            {profile.profilePhotoUrl ? (
              <div className="w-24 h-24 rounded-full overflow-hidden relative">
                <Image
                  src={profile.profilePhotoUrl}
                  alt="Profile photo"
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            ) : (
              <UserAvatar name={profile.name} role={profile.role} size="xl" />
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          <h2 className="mt-3 text-lg font-bold text-gray-900">{profile.name}</h2>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 mt-1">
            <Shield className="w-3 h-3" />
            {roleLabel(profile.role)}
          </span>
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900">Edit Profile</h3>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <User className="w-4 h-4" /> Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Mail className="w-4 h-4" /> Email
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Phone className="w-4 h-4" /> Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <FileText className="w-4 h-4" /> Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short bio about yourself..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        </div>

        {/* Password Change */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
        	<h3 className="font-semibold text-gray-900">Change Password</h3>
        	<p className="text-sm text-gray-500">
        		Enter your current password before choosing a new one.
        	</p>

        	<div>
        		<label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
        			<Lock className="w-4 h-4" /> Current Password
        		</label>
        		<input
        			type="password"
        			value={currentPassword}
        			onChange={(e) => setCurrentPassword(e.target.value)}
        			autoComplete="current-password"
        			className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        		/>
        	</div>

        	<div>
        		<label className="block text-sm font-medium text-gray-700 mb-1">
        			New Password
        		</label>
        		<input
        			type="password"
        			value={newPassword}
        			onChange={(e) => setNewPassword(e.target.value)}
        			autoComplete="new-password"
        			className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        		/>
        	</div>

        	<div>
        		<label className="block text-sm font-medium text-gray-700 mb-1">
        			Confirm New Password
        		</label>
        		<input
        			type="password"
        			value={confirmPassword}
        			onChange={(e) => setConfirmPassword(e.target.value)}
        			autoComplete="new-password"
        			className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        		/>
        	</div>
        </div>

        {/* Additional Info */}
        {profile.certifications.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Certifications</h3>
            <div className="flex flex-wrap gap-2">
              {profile.certifications.map((cert, i) => (
                <span key={i} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                  {cert}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
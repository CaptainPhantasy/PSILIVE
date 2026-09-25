"use client";

import Image from "next/image";
import { User } from "lucide-react";

interface UserAvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  role?: string;
  className?: string;
}

const sizeMap = {
  sm: { container: "w-8 h-8", icon: "w-4 h-4", text: "text-xs" },
  md: { container: "w-10 h-10", icon: "w-5 h-5", text: "text-sm" },
  lg: { container: "w-14 h-14", icon: "w-7 h-7", text: "text-lg" },
  xl: { container: "w-20 h-20", icon: "w-10 h-10", text: "text-2xl" },
};

const roleColors: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
  ADMIN: "bg-blue-100 text-blue-700",
  TECHNICIAN: "bg-green-100 text-green-700",
};

export function UserAvatar({ name, photoUrl, size = "md", role, className = "" }: UserAvatarProps) {
  const s = sizeMap[size];
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const colorClass = role ? roleColors[role] || "bg-gray-100 text-gray-700" : "bg-gray-100 text-gray-700";

  if (photoUrl) {
    return (
      <div className={`${s.container} relative rounded-full overflow-hidden flex-shrink-0 ${className}`}>
        <Image
          src={photoUrl}
          alt={`${name}'s avatar`}
          fill
          className="object-cover"
          sizes={size === "xl" ? "80px" : size === "lg" ? "56px" : size === "md" ? "40px" : "32px"}
        />
      </div>
    );
  }

  return (
    <div
      className={`${s.container} ${colorClass} rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
    >
      {initials ? (
        <span className={`${s.text} font-semibold`}>{initials}</span>
      ) : (
        <User className={s.icon} />
      )}
    </div>
  );
}

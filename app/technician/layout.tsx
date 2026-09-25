import { AuthProvider } from "@/contexts/auth-context";
import { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    default: "Field App | Precision Sewer Inspections",
    template: "%s | PSI Field App",
  },
  description: "Field technician mobile app for sewer scope inspections",
  manifest: "/technician-manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PSI Field",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1e40af",
};

export default function TechnicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </AuthProvider>
  );
}

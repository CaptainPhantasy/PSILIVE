import { AuthProvider } from "@/contexts/auth-context";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Admin Dashboard | Precision Sewer Inspections",
    template: "%s | PSI Admin",
  },
  description: "Admin dashboard for reviewing and approving sewer inspections",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100">
        {children}
      </div>
    </AuthProvider>
  );
}

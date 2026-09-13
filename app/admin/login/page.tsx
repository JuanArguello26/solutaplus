import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { AdminLoginForm } from "@/features/dashboard/components/AdminLoginForm";

export const metadata: Metadata = {
  title: "Acceso administrativo",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
          Panel administrativo
        </h1>
        <AdminLoginForm />
      </Card>
    </div>
  );
}

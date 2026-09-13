import { notFound } from "next/navigation";
import { AppError } from "@/server/errors/AppError";
import { LeadService } from "@/server/services/LeadService";
import { LeadDetailView } from "@/features/dashboard/components/LeadDetailView";

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminLeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;

  try {
    const lead = await LeadService.getLeadDetail(id);
    return <LeadDetailView leadId={id} initialData={lead} />;
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}

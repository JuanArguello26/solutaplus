import { LeadService } from "@/server/services/LeadService";
import { CatalogService } from "@/server/services/CatalogService";
import { leadQuerySchema } from "@/server/validators/lead-query.schema";
import { LeadsManager } from "@/features/dashboard/components/LeadsManager";

interface LeadsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminLeadsPage({ searchParams }: LeadsPageProps) {
  const rawParams = await searchParams;
  const filters = leadQuerySchema.parse(rawParams);

  const [result, services] = await Promise.all([
    LeadService.listLeads(filters),
    CatalogService.listServices(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
      <LeadsManager
        initialFilters={filters}
        initialData={result}
        services={services}
      />
    </div>
  );
}

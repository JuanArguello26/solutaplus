import { DashboardService } from "@/server/services/DashboardService";
import { DashboardKpis } from "@/features/dashboard/components/DashboardKpis";
import { LeadsChart } from "@/features/dashboard/components/LeadsChart";

// Sin esto, Next.js pre-renderiza esta página como estática en build
// time (no lee cookies/searchParams, así que no detecta que depende
// de datos en vivo) y las KPIs quedarían congeladas en los valores
// del momento del build.
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const stats = await DashboardService.getStats();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <DashboardKpis initialData={stats} />
      <LeadsChart initialData={stats} />
    </div>
  );
}

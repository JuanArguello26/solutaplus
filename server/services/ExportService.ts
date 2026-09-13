import ExcelJS from "exceljs";
import { LeadRepository } from "@/server/repositories/LeadRepository";
import { LEAD_STATUS_META } from "@/constants/lead-status";
import type { LeadQueryInput } from "@/server/validators/lead-query.schema";

type ExportFilters = Pick<
  LeadQueryInput,
  "status" | "serviceId" | "city" | "search" | "sortBy" | "sortDir"
>;

const COLUMNS = [
  { key: "fullName", header: "Nombre" },
  { key: "document", header: "Documento" },
  { key: "phone", header: "Teléfono" },
  { key: "email", header: "Correo" },
  { key: "city", header: "Ciudad" },
  { key: "service", header: "Servicio" },
  { key: "plan", header: "Plan" },
  { key: "estimatedPrice", header: "Precio estimado" },
  { key: "status", header: "Estado" },
  { key: "source", header: "Origen" },
  { key: "createdAt", header: "Fecha de creación" },
] as const;

// Los leads vienen del formulario público sin restricción de caracteres.
// Si un valor empieza con =, +, -, @ o un tab, Excel/Sheets lo interpreta
// como fórmula al abrir el CSV/XLSX (CSV/formula injection, CWE-1436).
// Se neutraliza anteponiendo un apóstrofe, el mismo mitigado estándar
// que usan Google Sheets/OWASP.
const FORMULA_TRIGGER_CHARS = ["=", "+", "-", "@", "\t", "\r"];

function neutralizeFormula(value: string): string {
  if (FORMULA_TRIGGER_CHARS.some((char) => value.startsWith(char))) {
    return `'${value}`;
  }
  return value;
}

async function getExportRows(filters: ExportFilters) {
  const leads = await LeadRepository.findAllForExport(filters);
  return leads.map((lead) => ({
    fullName: neutralizeFormula(lead.fullName),
    document: neutralizeFormula(lead.document ?? ""),
    phone: lead.phone,
    email: neutralizeFormula(lead.email),
    city: neutralizeFormula(lead.city),
    service: lead.service.name,
    plan: lead.plan?.name ?? "",
    estimatedPrice: lead.estimatedPrice ? Number(lead.estimatedPrice) : "",
    status: LEAD_STATUS_META[lead.status].label,
    source: lead.source ?? "",
    createdAt: lead.createdAt.toISOString(),
  }));
}

function escapeCsvValue(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const ExportService = {
  async toCsv(filters: ExportFilters): Promise<string> {
    const rows = await getExportRows(filters);
    const header = COLUMNS.map((column) => escapeCsvValue(column.header)).join(",");
    const lines = rows.map((row) =>
      COLUMNS.map((column) => escapeCsvValue(row[column.key])).join(","),
    );
    return [header, ...lines].join("\n");
  },

  async toExcelBuffer(filters: ExportFilters): Promise<Buffer> {
    const rows = await getExportRows(filters);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Leads");
    sheet.columns = COLUMNS.map((column) => ({
      key: column.key,
      header: column.header,
      width: 22,
    }));
    sheet.addRows(rows);
    sheet.getRow(1).font = { bold: true };

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  },
};

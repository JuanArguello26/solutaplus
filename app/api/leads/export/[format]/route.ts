import { NextResponse } from "next/server";
import { handleError } from "@/lib/api-response";
import { validationError } from "@/server/errors/AppError";
import { leadQuerySchema } from "@/server/validators/lead-query.schema";
import { ExportService } from "@/server/services/ExportService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ format: string }> },
) {
  try {
    const { format } = await params;
    if (format !== "csv" && format !== "xlsx") {
      throw validationError("Formato de exportación no soportado.");
    }

    const { searchParams } = new URL(request.url);
    const filters = leadQuerySchema.parse(Object.fromEntries(searchParams));
    const filename = `leads-${new Date().toISOString().slice(0, 10)}.${format}`;

    if (format === "csv") {
      const csv = await ExportService.toCsv(filters);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const buffer = await ExportService.toExcelBuffer(filters);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

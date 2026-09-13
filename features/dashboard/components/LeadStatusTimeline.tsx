import { Badge } from "@/components/ui/Badge";
import { LEAD_STATUS_META } from "@/constants/lead-status";
import { formatDateTime } from "@/lib/date";
import type { LeadStatusHistoryEntry } from "../types/leads";

interface LeadStatusTimelineProps {
  history: LeadStatusHistoryEntry[];
}

export function LeadStatusTimeline({ history }: LeadStatusTimelineProps) {
  if (history.length === 0) {
    return <p className="text-sm text-gray-500">Sin historial de estados.</p>;
  }

  return (
    <ol className="flex flex-col gap-4">
      {history.map((entry) => (
        <li key={entry.id} className="flex items-start gap-3">
          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gray-300" />
          <div>
            <div className="flex items-center gap-2">
              {entry.oldStatus && (
                <>
                  <Badge tone={LEAD_STATUS_META[entry.oldStatus].tone}>
                    {LEAD_STATUS_META[entry.oldStatus].label}
                  </Badge>
                  <span className="text-gray-400">→</span>
                </>
              )}
              <Badge tone={LEAD_STATUS_META[entry.newStatus].tone}>
                {LEAD_STATUS_META[entry.newStatus].label}
              </Badge>
            </div>
            {entry.comment && (
              <p className="mt-1 text-sm text-gray-600">{entry.comment}</p>
            )}
            <p className="mt-1 text-xs text-gray-400">
              {formatDateTime(entry.changedAt)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

import {
  HeartPulse,
  PiggyBank,
  ShieldCheck,
  Users,
  UserCheck,
  Zap,
  BadgeCheck,
  MapPin,
  ListChecks,
  FileEdit,
  Calculator,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  HeartPulse,
  PiggyBank,
  ShieldCheck,
  Users,
  UserCheck,
  Zap,
  BadgeCheck,
  MapPin,
  ListChecks,
  FileEdit,
  Calculator,
};

export function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? HelpCircle;
}

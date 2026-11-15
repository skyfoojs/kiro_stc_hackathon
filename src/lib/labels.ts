import { Activity, Flame, ShieldExclamationPoint, type LucideIcon } from 'lucide-react-native';

export type ReportType = 'fire' | 'earthquake' | 'security_threat';

export const REPORT_OPTIONS: { type: ReportType; label: string; icon: LucideIcon }[] = [
  { type: 'fire', label: 'Fire or smoke', icon: Flame },
  { type: 'earthquake', label: 'Earthquake', icon: Activity },
  { type: 'security_threat', label: 'Security threat', icon: ShieldExclamationPoint },
];

// Short name shown on alerts and banners. Reports are unconfirmed, so they say "reported".
export function incidentName(type: string | null | undefined): string {
  switch (type) {
    case 'fire':
      return 'Fire';
    case 'earthquake':
      return 'Earthquake';
    case 'security_threat':
      return 'Security threat';
    default:
      return 'Emergency';
  }
}


export function clockTime(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

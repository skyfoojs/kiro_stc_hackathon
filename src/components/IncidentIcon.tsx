import { Activity, Flame, ShieldExclamationPoint, Siren } from 'lucide-react-native';

type Props = { kind: string | null | undefined; color: string; size: number; strokeWidth?: number };

// Icon for an incident type; "Emergency" (no type) uses the siren.
export function IncidentIcon({ kind, color, size, strokeWidth = 2.4 }: Props) {
  switch (kind) {
    case 'fire':
      return <Flame color={color} size={size} strokeWidth={strokeWidth} />;
    case 'earthquake':
      return <Activity color={color} size={size} strokeWidth={strokeWidth} />;
    case 'security_threat':
      return <ShieldExclamationPoint color={color} size={size} strokeWidth={strokeWidth} />;
    default:
      return <Siren color={color} size={size} strokeWidth={strokeWidth} />;
  }
}

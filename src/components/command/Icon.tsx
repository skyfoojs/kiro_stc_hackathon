import type { CSSProperties } from 'react';

export type IconName =
  | 'safe'
  | 'wait'
  | 'unacc'
  | 'shield'
  | 'fire'
  | 'quake'
  | 'bolt'
  | 'lock'
  | 'check'
  | 'chev'
  | 'info'
  | 'close'
  | 'eye'
  | 'copy'
  | 'print'
  | 'send'
  | 'doc'
  | 'refresh'
  | 'dashboard'
  | 'bell'
  | 'timeline'
  | 'visitor'
  | 'people'
  | 'map'
  | 'audit'
  | 'dispatch'
  | 'plan'
  | 'switch';

const STATUS_COLOR: Partial<Record<IconName, string>> = {
  safe: 'var(--safe)',
  wait: 'var(--wait)',
  unacc: 'var(--unacc)',
};

/** Paths copied from the management v1 design. Decorative unless a label is given. */
function paths(name: IconName) {
  switch (name) {
    case 'safe':
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12.5 2.8 2.8L16 10" />
        </>
      );
    case 'wait':
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      );
    case 'unacc':
      return (
        <>
          <path d="M12 3 2.5 20h19z" />
          <path d="M12 10v4M12 17h.01" />
        </>
      );
    case 'shield':
      return <path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z" />;
    case 'fire':
      return <path d="M12 2.5c.8 3.4 4.8 5.6 4.8 10.3a4.8 4.8 0 0 1-9.6 0c0-2 1-3.4 2-4.4.2 1.6 1 2.6 2 2.9C10.8 8.6 11.4 5.2 12 2.5z" />;
    case 'quake':
      return <path d="M2 12h4l2-5 3 10 3-12 2 7h6" />;
    case 'bolt':
      return <path d="M13 2 5 13h6l-1 9 8-11h-6z" />;
    case 'lock':
      return (
        <>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </>
      );
    case 'check':
      return <path d="m5 12.5 4.5 4.5L19 7.5" />;
    case 'chev':
      return <path d="m9 6 6 6-6 6" />;
    case 'info':
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" />
        </>
      );
    case 'close':
      return <path d="M6 6l12 12M18 6 6 18" />;
    case 'eye':
      return (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </>
      );
    case 'copy':
      return (
        <>
          <rect x="8" y="8" width="12" height="13" rx="2" />
          <path d="M16 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h2" />
        </>
      );
    case 'print':
      return (
        <>
          <path d="M6 9V3h12v6" />
          <rect x="3" y="9" width="18" height="8" rx="2" />
          <path d="M7 14h10v7H7z" />
        </>
      );
    case 'send':
      return <path d="M3 11 21 3l-8 18-2-8z" />;
    case 'doc':
      return (
        <>
          <path d="M6 3h9l4 4v14H6z" />
          <path d="M9 12h7M9 16h7M9 8h3" />
        </>
      );
    case 'refresh':
      return <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />;
    case 'dashboard':
      return (
        <>
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </>
      );
    case 'bell':
      return (
        <>
          <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" />
          <path d="M10 21h4" />
        </>
      );
    case 'timeline':
      return (
        <>
          <circle cx="6" cy="6" r="2" />
          <circle cx="6" cy="18" r="2" />
          <path d="M6 8v8M11 6h9M11 18h9M11 12h9" />
        </>
      );
    case 'visitor':
      return (
        <>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <circle cx="12" cy="10" r="2.5" />
          <path d="M8 17a4 4 0 0 1 8 0" />
        </>
      );
    case 'people':
      return (
        <>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
          <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" />
        </>
      );
    case 'map':
      return (
        <>
          <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" />
          <path d="M9 4v14M15 6v14" />
        </>
      );
    case 'audit':
      return (
        <>
          <path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z" />
          <path d="M9 12h6M9 15h4" />
        </>
      );
    case 'dispatch':
      return (
        <>
          <path d="M3 11 21 3l-8 18-2-8z" />
          <path d="M11 13 21 3" />
        </>
      );
    case 'plan':
      return (
        <>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </>
      );
    case 'switch':
      return <path d="M7 7h12l-3-3M17 17H5l3 3" />;
  }
}

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  label?: string;
  style?: CSSProperties;
}

export default function Icon({ name, size = 20, color, strokeWidth, label, style }: Props) {
  const stroke = color ?? STATUS_COLOR[name] ?? 'currentColor';
  const sw = strokeWidth ?? (STATUS_COLOR[name] || name === 'check' ? 2.4 : 2.2);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      style={style}>
      {paths(name)}
    </svg>
  );
}

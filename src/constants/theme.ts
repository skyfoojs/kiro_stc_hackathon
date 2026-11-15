// Relay design tokens, taken from the customer prototype (docs/appname-customer.html).
// Light theme only; emergency screens use the alert colour as their background.
export const colors = {
  background: '#E5ECF2', // mist
  surface: '#FFFFFF',
  surfaceMuted: '#F3F6F9', // mist-2
  border: '#C9D4DF', // line
  ink: '#14213D', // navy
  inkMuted: '#4B5B78', // slate
  inkSubtle: '#7D8AA3',
  primary: '#14213D',
  primaryPressed: '#22335A',
  onPrimary: '#FFFFFF',
  onPrimaryMuted: '#AFC0D6',
  alert: '#FF5A1F', // orange
  alertPressed: '#E2480F',
  alertSoft: '#FFF1EA',
  onAlert: '#FFFFFF',
  onAlertMuted: 'rgba(255,255,255,0.85)',
  onAlertTile: 'rgba(255,255,255,0.18)',
  alarm: '#D7261E',
  alarmLed: '#FFE3DD',
  success: '#1D8A55',
  successSoft: '#DDF2E6',
  wait: '#9A6400',
  waitSoft: '#FFF0C7',
  danger: '#C42B3B',
  dangerSoft: '#FBE0E3',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;

export const radius = { sm: 8, md: 14, lg: 22, xl: 26, pill: 999 } as const;

export const type = {
  hero: { fontSize: 34, lineHeight: 38, fontWeight: '800', letterSpacing: -0.6 },
  title: { fontSize: 26, lineHeight: 30, fontWeight: '800', letterSpacing: -0.4 },
  heading: { fontSize: 19, lineHeight: 24, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  step: { fontSize: 17, lineHeight: 23, fontWeight: '700' },
  small: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 17, fontWeight: '700' },
} as const;

export const ICON_SIZE = 22;
export const ICON_STROKE = 2.2;

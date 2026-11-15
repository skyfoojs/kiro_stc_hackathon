import type {
  Account,
  AccountId,
  IncidentKind,
  MarkerNames,
  PastIncident,
  Person,
  Team,
  TeamStatus,
  Tower,
  Visitor,
} from '@/types/command';

export const ACCOUNTS: Record<AccountId, Account> = {
  hasnah: {
    id: 'hasnah',
    name: 'Hasnah Yusof',
    roleLabel: 'UOA Security, Control Room',
    initials: 'HY',
    role: 'security',
    perms: ['Trigger and end incidents', 'Dashboard', 'Send plan for review', 'Share with Bomba'],
  },
  razak: {
    id: 'razak',
    name: 'Captain Razak Ibrahim',
    roleLabel: 'Bomba incident commander',
    initials: 'RI',
    role: 'commander',
    perms: ['Dashboard', 'Plan received for review', 'Lift or stairs decision', 'Share with Bomba'],
  },
  tan: {
    id: 'tan',
    name: 'Mr. Tan Kok Wai',
    roleLabel: 'UOA Building Management, admin',
    initials: 'TK',
    role: 'admin',
    perms: ['People and profiles', 'Building maps', 'Audit log', 'Dashboard', 'Share with Bomba'],
  },
};

export const TOWERS: Tower[] = [
  { id: 'bsa', name: 'Business Suites Tower A', short: 'BS Tower A', meta: '35 storeys + 5-floor podium', floors: 40 },
  { id: 'bsb', name: 'Business Suites Tower B', short: 'BS Tower B', meta: '32 storeys + podium', floors: 37 },
  { id: 'uoa', name: 'UOA Corporate Tower', short: 'UOA CT', meta: '38 storeys', floors: 38 },
  { id: 'vctb', name: 'Vertical Corporate Tower B', short: 'VCT B', meta: '40 storeys', floors: 40 },
];

export const DEMO_TOWER_ID = 'uoa';
export const DEMO_FLOOR = 22;

/** Demo clock: the console opens at 10:40:50 so a trigger lands around 10:41:30. */
export const BASE_SEC = 10 * 3600 + 40 * 60 + 50;

export const RECIPIENTS = 387;

export interface Guidance {
  label: string;
  short: string;
  title: string;
  text: string;
  banner: string;
}

export const GUIDANCE: Record<IncidentKind, Guidance> = {
  fire: {
    label: 'Fire, evacuate',
    short: 'fire',
    banner: 'Live incident: fire',
    title: 'Fire: evacuate now',
    text: "Leave now by the nearest stairwell. Do not use lifts. Go to Assembly point A and check in. If you can't use stairs, go to the Stairwell B waiting point and tap I need help.",
  },
  earthquake: {
    label: 'Earthquake, shelter then evacuate',
    short: 'earthquake',
    banner: 'Live incident: earthquake',
    title: 'Earthquake: drop, cover, hold on',
    text: 'Drop, cover and hold on until the shaking stops. Then leave by the nearest stairwell when told. Do not use lifts.',
  },
  outage: {
    label: 'Power outage, stay put',
    short: 'power outage',
    banner: 'Live incident: power outage',
    title: 'Power outage: stay put',
    text: 'Stay where you are unless the control room tells you to leave. Lifts are out of service. Use your phone torch on the stairs.',
  },
  security: {
    label: 'Security threat, lockdown',
    short: 'security threat',
    banner: 'Live incident: security threat',
    title: 'Security threat: lockdown',
    text: 'Stay inside. Lock or block the door, silence your phone, and stay out of sight. Do not go to the assembly point until told.',
  },
};

const AISYAH_NEED = "Can't use stairs. Leg injury, walking with a crutch.";

/** Level 22 roster before the incident. Everyone starts unaccounted for until they check in. */
export function seedPeople(): Person[] {
  const p = (id: string, name: string, company: string, extra?: Partial<Person>): Person => ({
    id,
    name,
    company,
    towerId: DEMO_TOWER_ID,
    floor: DEMO_FLOOR,
    status: 'unacc',
    place: 'Last seen L22',
    time: null,
    assist: 'No',
    ...extra,
  });
  return [
    p('aisyah', 'Aisyah Rahman', 'Meridian Legal', {
      assist: 'Yes',
      condition: 'Leg injury, temporary, until 30 Nov 2026',
      note: '"Can walk short distances with a crutch. Stairs are not possible right now."',
      need: AISYAH_NEED,
      time: '10:38',
      source: 'Barometer agrees: L22',
    }),
    p('daniel', 'Daniel Ong', 'Meridian Legal', { time: '10:30' }),
    p('farah', 'Farah Aziz', 'Meridian Legal', { time: '10:31' }),
    p('kevin', 'Kevin Lim', 'Meridian Legal', { time: '10:25' }),
    p('nurul', 'Nurul Huda', 'Meridian Legal', { time: '10:33' }),
    p('priya', 'Priya Nair', 'Kestrel Analytics', { time: '10:28' }),
    p('jason', 'Jason Tan', 'Kestrel Analytics', { time: '10:20' }),
    p('siti', 'Siti Mariam', 'Kestrel Analytics', { time: '10:35' }),
    p('hafiz', 'Hafiz Ismail', 'Kestrel Analytics', { time: '10:36' }),
    p('grace', 'Grace Wong', 'Kestrel Analytics', { time: '10:34' }),
    p('limwj', 'Lim Wei Jie', 'Kestrel Analytics', { time: '09:15', source: 'App opened' }),
    p('amirul', 'Amirul Hakim', 'Meridian Legal', { time: '10:12' }),
    p('sarah', 'Sarah Chong', 'Kestrel Analytics', { place: 'No update since sign-in', time: null }),
    p('jessica', 'Jessica Lau', 'Meridian Legal', {
      assist: 'Sometimes',
      note: 'Prefers a slower pace on long stairwells.',
      left: true,
      status: 'safe',
      place: 'Not in the building',
    }),
  ];
}

/** People who left the company are kept for the admin screen but not counted. */
export function isCounted(p: Person): boolean {
  return !p.left;
}

export function seedTeams(): Team[] {
  const t = (id: string, name: string, channel: string, ticked = true, note?: string): Team => ({
    id,
    name,
    channel,
    ticked,
    note,
    status: 'not-sent',
    words: '',
    updated: null,
  });
  return [
    t('pantai', 'Bomba Pantai', 'App, SMS fallback'),
    t('hangtuah', 'Bomba Hang Tuah', 'App, SMS fallback'),
    t('seputeh', 'Bomba Seputeh', 'App, SMS fallback'),
    t('highrise', 'Bomba high-rise rescue', 'App, SMS fallback'),
    t('emrs', 'Bomba EMRS (ambulance)', 'App, SMS fallback'),
    t('ert', 'Building ERT (UOA / THBS JMB)', 'Radio, app'),
    t('pdrm', 'PDRM patrol', 'SMS', false, 'Not needed for a fire'),
  ];
}

/** Scripted replies after "Send for review": seconds after send, team, their own words. */
export const TEAM_SCRIPT: { after: number; teamId: string; words: string }[] = [
  { after: 2, teamId: 'pantai', words: 'On the way, about 6 minutes.' },
  { after: 4, teamId: 'ert', words: 'At the lobby. Fire lift unlocked and plans ready.' },
  { after: 6, teamId: 'hangtuah', words: 'On the way, about 8 minutes.' },
  { after: 8, teamId: 'highrise', words: 'On the way, about 9 minutes.' },
  { after: 10, teamId: 'emrs', words: 'Heading to Assembly point A.' },
  { after: 12, teamId: 'seputeh', words: 'On the way, about 11 minutes.' },
];

/** Check-ins after the trigger: seconds after trigger, person, GPS confirmed. Amirul arrives at +15 s. */
export const CHECKIN_SCRIPT: { after: number; personId: string; gps: boolean }[] = [
  { after: 3, personId: 'farah', gps: false },
  { after: 4, personId: 'kevin', gps: true },
  { after: 5, personId: 'daniel', gps: true },
  { after: 6, personId: 'nurul', gps: false },
  { after: 7, personId: 'priya', gps: true },
  { after: 8, personId: 'jason', gps: false },
  { after: 9, personId: 'siti', gps: false },
  { after: 10, personId: 'hafiz', gps: true },
  { after: 11, personId: 'grace', gps: false },
  { after: 15, personId: 'amirul', gps: true },
];

export const HELP_SCRIPT_AFTER = 2;

export function seedVisitors(): Visitor[] {
  return [
    { id: 'marcus', name: 'Marcus Teo', visiting: 'Kestrel Analytics', towerId: 'uoa', floor: 22, checkedIn: '10:20', status: 'unacc', last: 'No update since check-in' },
    { id: 'hannah', name: 'Hannah Lee', visiting: 'Meridian Legal', towerId: 'uoa', floor: 22, checkedIn: '09:58', status: 'unacc', last: 'No update since check-in' },
    { id: 'ong', name: 'Ong Bee Lian', visiting: 'Sentosa Media', towerId: 'uoa', floor: 14, checkedIn: '10:05', status: 'unacc', last: 'No update since check-in' },
    { id: 'arif', name: 'Arif Zulkifli', visiting: 'Bayu Capital', towerId: 'bsa', floor: 18, checkedIn: '09:30', status: 'elsewhere', last: '' },
    { id: 'chloe', name: 'Chloe Ng', visiting: 'Hilltop Advisory', towerId: 'vctb', floor: 31, checkedIn: '10:12', status: 'elsewhere', last: '' },
    { id: 'suresh', name: 'Suresh Menon', visiting: 'Orchid Freight', towerId: 'bsb', floor: 9, checkedIn: '08:45', status: 'elsewhere', last: '' },
  ];
}

/** Visitors who check in during the scripted incident: seconds after trigger. */
export const VISITOR_SCRIPT: { after: number; visitorId: string }[] = [
  { after: 6, visitorId: 'ong' },
  { after: 12, visitorId: 'hannah' },
];

export const DEFAULT_MARKERS: MarkerNames = {
  a: 'Stairwell A',
  b: 'Stairwell B',
  lift: 'Bomba lift lobby',
  wait: 'Stairwell B waiting point',
  asm: 'Assembly point A',
};

export const PAST_INCIDENTS: PastIncident[] = [
  {
    label: '14 Aug 2026, ended',
    title: 'Mock fire drill, UOA Corporate Tower',
    detail: 'Origin Level 22. 1 h 12 min. 3 help requests. Everyone accounted for.',
  },
];

export const KIND_LABEL: Record<IncidentKind, string> = {
  fire: 'Fire',
  earthquake: 'Earthquake',
  outage: 'Power outage',
  security: 'Security threat',
};

/** Places and teams the plan checker accepts (G7). */
export const MAP_PLACES = [
  'main entrance',
  'fire command centre',
  'stairwell a',
  'stairwell b',
  'fire lift',
  'bomba lift',
  'waiting point',
  'assembly point',
];

export const TEAM_STATUS_LABEL: Record<TeamStatus, string> = {
  'not-sent': 'Not sent',
  sent: 'Sent',
  acknowledged: 'Acknowledged',
  'en-route': 'En route',
  'at-staging': 'At staging',
  'on-floor': 'On floor',
  'person-reached': 'Person reached',
  done: 'Done',
};

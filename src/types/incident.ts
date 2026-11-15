export type OccupantState = 'unaccounted' | 'needs_help' | 'help_on_way' | 'responding' | 'safe';

export type HelpStatus = 'open' | 'acknowledged' | 'resolved' | 'cancelled';

export type ActiveIncident = {
  incident: {
    id: string;
    type: string | null;
    action: 'evacuate' | 'shelter_in_place' | 'lockdown';
    title: string;
    source: 'management' | 'occupant_report';
    started_at: string;
    report_count: number;
    floor_label: string | null;
    floor_level: number | null;
    tower_name: string;
  };
  guidance: { title: string; steps: string[]; details: string[] } | null;
  me: {
    state: OccupantState;
    needs_assistance: boolean;
    role: 'employee' | 'management';
    floor_level: number | null;
    safe_at: string | null;
    gps_verified: boolean;
  };
  help_request: {
    id: string;
    status: HelpStatus;
    created_at: string;
    acknowledged_at: string | null;
    arrived_at: string | null;
  } | null;
  assembly_point: { id: string; label: string; lat: number | null; lng: number | null; radius_m: number | null } | null;
};

export type Profile = {
  id: string;
  full_name: string;
  role: 'employee' | 'management';
  tower_id: string;
  floor: { label: string; level: number } | null;
  tower: { name: string } | null;
  company: { name: string } | null;
};

export type Assistance = {
  oku_status: 'registered' | 'not_oku' | 'prefer_not_to_say';
  stair_help: 'yes' | 'sometimes' | 'no';
  note: string | null;
  is_temporary: boolean;
  temporary_until: string | null;
};

export type OfficeStatus = { company: string | null; people: { name: string; me: boolean; safe: boolean }[] };

export type IncidentSummary = {
  id: string;
  type: string | null;
  status: 'active' | 'resolved';
  started_at: string;
  resolved_at: string | null;
  floor_label: string | null;
  tower_name: string;
  help: {
    created_at: string;
    status: HelpStatus;
    acknowledged_at: string | null;
    arrived_at: string | null;
    resolved_at: string | null;
    cancelled_at: string | null;
  } | null;
  safe_at: string | null;
  safe_method: string | null;
  assembly_point: string | null;
};

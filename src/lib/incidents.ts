import type { ReportType } from '@/lib/labels';
import { supabase } from '@/lib/supabase';
import type { ActiveIncident, Assistance, IncidentSummary, OfficeStatus, Profile } from '@/types/incident';

function fail(action: string): never {
  throw new Error(`Could not ${action}. Check your connection and try again.`);
}

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, tower_id, floor:floors(label, level), tower:towers(name), company:companies(name)')
    .eq('id', userId)
    .single();
  if (error || !data) fail('load your profile');
  return data as unknown as Profile;
}

export async function fetchMyAssistance(userId: string): Promise<Assistance | null> {
  const { data, error } = await supabase
    .from('assistance_profiles')
    .select('oku_status, stair_help, note, is_temporary, temporary_until')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) fail('load your assistance profile');
  return (data as Assistance | null) ?? null;
}

export async function fetchActiveIncident(): Promise<ActiveIncident | null> {
  const { data, error } = await supabase.rpc('get_active_incident');
  if (error) fail('check for emergencies');
  return (data as ActiveIncident | null) ?? null;
}

export async function fetchIncidentSummary(): Promise<IncidentSummary | null> {
  const { data, error } = await supabase.rpc('get_my_incident_summary');
  if (error) fail('load your timeline');
  return (data as IncidentSummary | null) ?? null;
}

export async function fetchOfficeStatus(incidentId: string): Promise<OfficeStatus> {
  const { data, error } = await supabase.rpc('get_my_office_status', { p_incident_id: incidentId });
  if (error || !data) fail('load your office');
  return data as OfficeStatus;
}

export async function reportIncident(type: ReportType): Promise<{ incidentId: string; created: boolean }> {
  const { data, error } = await supabase.rpc('report_incident', { p_type: type });
  if (error || !data) fail('report the emergency');
  const result = data as { incident_id: string; created: boolean };
  return { incidentId: result.incident_id, created: result.created };
}

export async function requestHelp(incidentId: string): Promise<void> {
  const { error } = await supabase.rpc('request_help', { p_incident_id: incidentId });
  if (error) fail('send your help request');
}

export async function cancelHelp(helpRequestId: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_help', { p_help_request_id: helpRequestId });
  if (error) fail('cancel your help request');
}

// Sends the person's floor to the control room (barometer estimate or a floor they picked).
export async function reportLocation(
  incidentId: string,
  floorLevel: number,
  source: 'barometer' | 'manual',
  barometerEstimate: number | null,
): Promise<void> {
  const { error } = await supabase.rpc('report_location', {
    p_incident_id: incidentId,
    p_floor_level: floorLevel,
    p_source: source,
    p_barometer_estimate: barometerEstimate,
  });
  if (error) fail('share your location');
}

export async function markSafe(incidentId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_safe', { p_incident_id: incidentId, p_method: 'self_report' });
  if (error) fail('mark you as safe');
}

// DEMO: GPS isn't read yet, so the check-in sends the assembly point's own
// position, which the backend then confirms as inside the radius.
export async function checkInAtAssembly(incidentId: string, point: { id: string; lat: number | null; lng: number | null }): Promise<void> {
  const { error } = await supabase.rpc('mark_safe', {
    p_incident_id: incidentId,
    p_method: 'assembly_gps',
    p_assembly_point_id: point.id,
    p_lat: point.lat,
    p_lng: point.lng,
  });
  if (error) fail('check you in');
}

// "L22" -> "Level 22", level 0 -> "Ground floor".
export function floorName(level: number | null | undefined, label?: string | null): string {
  if (level === 0) return 'Ground floor';
  if (typeof level === 'number') return `Level ${level}`;
  return label ?? 'Your floor';
}

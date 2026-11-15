import { supabase } from '@/lib/supabase';

// Supabase Auth signs in with email, so usernames map to a fixed demo domain.
export const DEMO_EMAIL_DOMAIN = 'demo.uoa-evac.app';

// DEMO ONLY. Every seeded account shares this password (see supabase/seed.sql).
export const DEMO_PASSWORD = 'test@123';

export type DemoAccount = {
  username: string;
  name: string;
  description: string;
  tone: 'alert' | 'primary';
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { username: 'aisyah', name: 'Aisyah Rahman', description: 'Staff who needs help on stairs, Meridian Capital', tone: 'alert' },
  { username: 'daniel', name: 'Daniel Tan', description: 'Standard staff, Meridian Capital', tone: 'primary' },
  { username: 'lim', name: 'Lim Wei Jie', description: 'Wheelchair user, Kinabalu Tech', tone: 'alert' },
];

export function usernameToEmail(username: string): string {
  const clean = username.trim().toLowerCase();
  return clean.includes('@') ? clean : `${clean}@${DEMO_EMAIL_DOMAIN}`;
}

export async function signIn(username: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });
  if (error) {
    throw new Error(
      error.message === 'Invalid login credentials'
        ? 'Wrong username or password.'
        : 'Could not sign in. Check your connection and try again.',
    );
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

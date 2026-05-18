import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getSessionRole } from '../services/auth';
import type { AppRole, PermissionSet } from '../types/auth';

interface AuthState {
  loading: boolean;
  authenticated: boolean;
  session: Session | null;
  user: User | null;
  role: AppRole;
  permissions: PermissionSet;
  refreshAccess: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function readAccess(session: Session | null) {
  if (!session) {
    return { session: null, role: 'visitor' as AppRole, permissions: {} as PermissionSet };
  }

  const metadata = session.user.app_metadata as Record<string, unknown> | undefined;
  const metadataRole = getSessionRole(metadata);
  const metadataPermissions = (metadata?.permissions || {}) as PermissionSet;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, permissions')
    .eq('id', session.user.id)
    .maybeSingle();

  if (profile?.role) {
    return {
      session,
      role: getSessionRole({ role: profile.role }),
      permissions: (profile.permissions || metadataPermissions) as PermissionSet,
    };
  }

  return { session, role: metadataRole, permissions: metadataPermissions };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>('visitor');
  const [permissions, setPermissions] = useState<PermissionSet>({});

  const applySession = async (nextSession: Session | null) => {
    const access = await readAccess(nextSession);
    setSession(access.session);
    setRole(access.role);
    setPermissions(access.permissions);
  };

  const refreshAccess = async () => {
    const { data } = await supabase.auth.getSession();
    await applySession(data.session);
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      await applySession(data.session);
      if (mounted) setLoading(false);
    };

    load();
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(() => ({
    loading,
    authenticated: Boolean(session),
    session,
    user: session?.user || null,
    role,
    permissions,
    refreshAccess,
  }), [loading, permissions, role, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}

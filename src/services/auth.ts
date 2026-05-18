import { supabase } from '../lib/supabase';
import type { AppRole, AuthUserResult, InviteStaffInput, PermissionSet, RegisterUserInput, StaffUser } from '../types/auth';

interface RegisterResponse {
  user: AuthUserResult;
}

interface InviteStaffResponse {
  user: AuthUserResult & {
    permissions: Record<string, boolean>;
    temporaryPassword: string;
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : 'Nao foi possivel concluir a autenticacao.';
}

async function parseFunctionError(error: unknown) {
  const response = (error as { context?: Response }).context;
  if (!response) return getErrorMessage(error);

  try {
    const body = await response.json() as { error?: string };
    return body.error || getErrorMessage(error);
  } catch {
    return getErrorMessage(error);
  }
}

export async function registerUser(input: RegisterUserInput): Promise<AuthUserResult> {
  const { data, error } = await supabase.functions.invoke<RegisterResponse>('register-user', {
    body: input,
  });

  if (error) {
    throw new Error(await parseFunctionError(error));
  }

  if (!data?.user) {
    throw new Error('Cadastro criado sem retorno de usuario.');
  }

  return data.user;
}

export async function signInUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export function getSessionRole(appMetadata: Record<string, unknown> | undefined): AppRole {
  const role = appMetadata?.role;
  if (role === 'visitor' || role === 'guest' || role === 'attendant' || role === 'kitchen' || role === 'housekeeping' || role === 'manager' || role === 'admin' || role === 'master') {
    return role;
  }
  return 'visitor';
}

export async function getCurrentAccess(): Promise<{ authenticated: boolean; role: AppRole; permissions: PermissionSet }> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { authenticated: false, role: 'visitor', permissions: {} };
  }

  const { data: refreshed } = await supabase.auth.refreshSession();
  const session = refreshed.session || sessionData.session;
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
      authenticated: true,
      role: getSessionRole({ role: profile.role }),
      permissions: (profile.permissions || metadataPermissions) as PermissionSet,
    };
  }

  return {
    authenticated: true,
    role: metadataRole,
    permissions: metadataPermissions,
  };
}

export async function inviteStaff(input: InviteStaffInput) {
  const { data, error } = await supabase.functions.invoke<InviteStaffResponse>('invite-staff', {
    body: input,
  });

  if (error) {
    throw new Error(await parseFunctionError(error));
  }

  if (!data?.user) throw new Error('Convite criado sem retorno de usuario.');
  return data.user;
}

export async function listStaffUsers(): Promise<StaffUser[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone, role, permissions, created_at')
    .neq('role', 'guest')
    .neq('role', 'visitor')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map(item => ({
    id: item.id,
    email: item.email,
    fullName: item.full_name,
    phone: item.phone,
    role: getSessionRole({ role: item.role }),
    permissions: item.permissions || {},
    createdAt: item.created_at,
  }));
}

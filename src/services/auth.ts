import { supabase } from '../lib/supabase';
import type { AppRole, AuthUserResult, InviteStaffInput, PermissionSet, RegisterUserInput, RemoveStaffInput, StaffUser, UpdateStaffInput } from '../types/auth';

interface RegisterResponse {
  user: AuthUserResult;
}

interface InviteStaffResponse {
  user: AuthUserResult & {
    permissions: Record<string, boolean>;
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

export async function updateCurrentUserProfile(input: { fullName: string; phone: string; email: string }) {
  const fullName = input.fullName.trim();
  const phone = input.phone.trim();
  const email = input.email.trim().toLowerCase();

  const { data: authData, error: authError } = await supabase.auth.updateUser({
    email,
    data: { full_name: fullName, phone },
  });
  if (authError) throw new Error(authError.message);

  const user = authData.user;
  if (!user) throw new Error('Sessao invalida para atualizar perfil.');

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ email, full_name: fullName, phone, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (profileError) throw new Error(profileError.message);
  return user;
}

export function getSessionRole(appMetadata: Record<string, unknown> | undefined): AppRole {
  const role = appMetadata?.role;
  if (
    role === 'visitor' ||
    role === 'guest' ||
    role === 'attendant' ||
    role === 'frontdesk' ||
    role === 'kitchen' ||
    role === 'housekeeping' ||
    role === 'financial' ||
    role === 'hr' ||
    role === 'manager' ||
    role === 'admin' ||
    role === 'master'
  ) {
    return role;
  }
  return 'visitor';
}

export async function getCurrentAccess(): Promise<{ authenticated: boolean; role: AppRole; permissions: PermissionSet }> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { authenticated: false, role: 'visitor', permissions: {} };
  }

  const session = sessionData.session;
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

export async function updateStaff(input: UpdateStaffInput): Promise<void> {
  const { error } = await supabase.functions.invoke('update-staff', { body: input });
  if (error) throw new Error(await parseFunctionError(error));
}

export async function removeStaff(input: RemoveStaffInput): Promise<void> {
  const { error } = await supabase.functions.invoke('remove-staff', { body: input });
  if (error) throw new Error(await parseFunctionError(error));
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

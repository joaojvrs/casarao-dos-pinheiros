import type { AppRole, PermissionSet } from '../types/auth';

export function getDefaultRouteForAccess(role: AppRole, permissions: PermissionSet = {}) {
  if (role === 'master' || role === 'admin' || role === 'manager') return '/equipe';
  if (role === 'attendant') return '/equipe/atendimento';
  if (role === 'frontdesk') return '/equipe/recepcao';
  if (role === 'kitchen') return '/equipe/cozinha';
  if (role === 'housekeeping') return '/equipe/governanca';
  if (role === 'financial') return '/equipe/financeiro';
  if (role === 'hr') return '/equipe/rh';
  if (role === 'guest') return '/hospede';
  if (permissions.hr) return '/equipe/rh';
  if (permissions.payments) return '/equipe/financeiro';
  if (permissions.bookings || permissions.guests) return '/equipe/recepcao';
  if (permissions.kitchen) return '/equipe/cozinha';
  if (permissions.housekeeping) return '/equipe/governanca';
  if (permissions.roomService) return '/equipe/atendimento';
  return '/reservas';
}

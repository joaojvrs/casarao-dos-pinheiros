import type { AppRole, PermissionSet } from '../types/auth';

export function getDefaultRouteForAccess(role: AppRole, permissions: PermissionSet = {}) {
  if (role === 'master' || role === 'admin' || role === 'manager') return '/equipe';
  if (role === 'attendant') return '/equipe/atendimento';
  if (role === 'kitchen') return '/equipe/cozinha';
  if (role === 'housekeeping') return '/equipe/governanca';
  if (role === 'guest') return '/hospede';
  if (permissions.kitchen) return '/equipe/cozinha';
  if (permissions.housekeeping) return '/equipe/governanca';
  if (permissions.roomService || permissions.bookings) return '/equipe/atendimento';
  return '/reservas';
}

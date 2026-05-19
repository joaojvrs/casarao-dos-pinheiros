export type AppRole =
  | 'visitor'
  | 'guest'
  | 'attendant'
  | 'frontdesk'
  | 'kitchen'
  | 'housekeeping'
  | 'financial'
  | 'hr'
  | 'manager'
  | 'admin'
  | 'master';

export interface PermissionSet {
  bookings?: boolean;
  guests?: boolean;
  kitchen?: boolean;
  housekeeping?: boolean;
  roomService?: boolean;
  payments?: boolean;
  users?: boolean;
  reports?: boolean;
  settings?: boolean;
  hr?: boolean;
}

export interface RegisterUserInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthUserResult {
  userId: string;
  email: string;
  role: AppRole;
}

export interface InviteStaffInput {
  fullName: string;
  email: string;
  phone: string;
  role: Exclude<AppRole, 'visitor' | 'guest' | 'master'>;
  permissions: PermissionSet;
}

export interface UpdateStaffInput {
  userId: string;
  role: Exclude<AppRole, 'visitor' | 'guest' | 'master'>;
  permissions: PermissionSet;
}

export interface RemoveStaffInput {
  userId: string;
}

export interface StaffUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: AppRole;
  permissions: PermissionSet;
  createdAt: string;
}

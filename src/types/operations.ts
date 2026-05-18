export interface RecentBooking {
  id: string;
  confirmationCode: string;
  total: number;
  guestsCount: number;
  checkIn: string;
  checkOut: string;
  status: string;
  accommodation?: string;
  guest?: string;
}

export interface OperationsSummary {
  canViewFinancial: boolean;
  activeGuests: number;
  activeBookings: number;
  monthBookings: number;
  monthRevenue: number;
  lodgingRevenue: number;
  consumptionRevenue: number;
  averageTicket: number;
  recentBookings: RecentBooking[];
}

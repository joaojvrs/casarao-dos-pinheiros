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
  restaurantRevenue: number;
  averageTicket: number;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  roomNightsMonth: number;
  adr: number;
  revpar: number;
  recentBookings: RecentBooking[];
}

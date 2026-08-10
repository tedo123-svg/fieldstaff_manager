export type Role = 'SUPER_ADMIN' | 'ORG_MANAGER' | 'MEMBER';
export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'CHECKED_OUT' | 'WORKING';
export type LocationStatus = 'AT_WORK' | 'NEARBY' | 'OUTSIDE' | 'OFFLINE';
export type Gender = 'MALE' | 'FEMALE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId?: string;
  avatar?: string;
}

export interface Organization {
  id: string;
  name: string;        // Amharic
  nameEn: string;      // English
  nameOm: string;      // Afaan Oromo
  color: string;
  bgColor: string;
  textColor: string;
  icon: string;
  description?: string;
  memberCount: number;
  activeCount: number;
}

export interface Member {
  id: string;
  fullName: string;
  memberId: string;
  gender: Gender;
  phone: string;
  profilePhoto?: string;
  organizationId: string;
  organization?: Organization;
  jobRole: string;
  workAddress: string;
  workLocationId?: string;
  workLocation?: WorkLocation;
  registrationDate: string;
  status: MemberStatus;
  emergencyContact: string;
  notes?: string;
  locationStatus?: LocationStatus;
  isSharing?: boolean;
  lastLocation?: GPSLocation;
  todayAttendance?: Attendance;
}

export interface WorkLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  organizationId: string;
  organization?: Organization;
  workingHoursStart: string;
  workingHoursEnd: string;
  geofenceRadius: number;
  status: 'ACTIVE' | 'INACTIVE';
  assignedMembers?: Member[];
}

export interface Attendance {
  id: string;
  memberId: string;
  member?: Member;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  notes?: string;
  createdAt: string;
}

export interface GPSLocation {
  id: string;
  memberId: string;
  member?: Member;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  isSharing: boolean;
  deviceStatus: 'ONLINE' | 'OFFLINE';
}

export interface Notification {
  id: string;
  type: 'CHECK_IN' | 'CHECK_OUT' | 'ENTERED_AREA' | 'LEFT_AREA' | 'OFFLINE' | 'GPS_STOPPED' | 'LATE' | 'ALERT';
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  currentlyWorking: number;
  sharingLocation: number;
  absentMembers: number;
  outsideAssigned: number;
  orgStats: OrgStat[];
}

export interface OrgStat {
  orgId: string;
  name: string;
  nameEn: string;
  color: string;
  total: number;
  active: number;
  working: number;
  absent: number;
}

export interface AlertRule {
  id: string;
  type: string;
  enabled: boolean;
  threshold?: number;
  description: string;
}

export interface ReportFilter {
  type: 'members' | 'attendance' | 'location' | 'late' | 'outside';
  dateFrom: string;
  dateTo: string;
  organizationId?: string;
  memberId?: string;
  workLocationId?: string;
}

export interface MemberFilters {
  search: string;
  organizationId: string;
  status: string;
  locationStatus: string;
  attendanceStatus: string;
  isSharing: string;
}

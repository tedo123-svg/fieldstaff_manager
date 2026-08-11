/**
 * Maps raw Supabase snake_case rows to the camelCase types used by the app.
 * Supabase returns snake_case column names — the app TypeScript types use camelCase.
 */

import type { Member, Organization, Group, Woreda, WorkLocation, Attendance, GPSLocation } from '../types';

type Raw = Record<string, unknown>;

export function mapOrg(o: Raw): Organization {
  return {
    id:          o.id as string,
    name:        o.name as string,
    nameEn:      (o.name_en  ?? o.nameEn  ?? '') as string,
    nameOm:      (o.name_om  ?? o.nameOm  ?? '') as string,
    color:       (o.color    ?? '#3B82F6') as string,
    bgColor:     (o.bg_color ?? o.bgColor ?? '') as string,
    textColor:   (o.text_color ?? o.textColor ?? 'text-white') as string,
    icon:        (o.icon     ?? '🔵') as string,
    description: o.description as string | undefined,
    hasGroups:   (o.has_groups ?? o.hasGroups ?? false) as boolean,
    memberCount: (o.member_count ?? o.memberCount ?? 0) as number,
    activeCount: (o.active_count ?? o.activeCount ?? 0) as number,
  };
}

export function mapWoreda(w: Raw): Woreda {
  return {
    id:        w.id as string,
    name:      w.name as string,
    subcityId: (w.subcity_id ?? w.subcityId) as string,
    subcity:   w.subcity ? { id: (w.subcity as Raw).id as string, name: (w.subcity as Raw).name as string } : undefined,
  };
}

export function mapGroup(g: Raw): Group {
  return {
    id:             g.id as string,
    name:           g.name as string,
    organizationId: (g.organization_id ?? g.organizationId) as string,
    woredaId:       (g.woreda_id ?? g.woredaId) as string,
    woreda:         g.woreda ? mapWoreda(g.woreda as Raw) : undefined,
    memberCount:    (g.member_count ?? g.memberCount ?? 0) as number,
  };
}

export function mapAttendance(a: Raw): Attendance {
  return {
    id:        a.id as string,
    memberId:  (a.member_id ?? a.memberId) as string,
    date:      a.date as string,
    checkIn:   (a.check_in  ?? a.checkIn)  as string | undefined,
    checkOut:  (a.check_out ?? a.checkOut) as string | undefined,
    status:    a.status as Attendance['status'],
    notes:     a.notes as string | undefined,
    createdAt: (a.created_at ?? a.createdAt) as string,
  };
}

export function mapGPS(g: Raw): GPSLocation {
  return {
    id:           g.id as string,
    memberId:     (g.member_id ?? g.memberId) as string,
    latitude:     g.latitude as number,
    longitude:    g.longitude as number,
    accuracy:     g.accuracy as number | undefined,
    timestamp:    g.timestamp as string,
    isSharing:    (g.is_sharing ?? g.isSharing ?? false) as boolean,
    deviceStatus: (g.device_status ?? g.deviceStatus ?? 'OFFLINE') as GPSLocation['deviceStatus'],
  };
}

export function mapWorkLocation(l: Raw): WorkLocation {
  return {
    id:                 l.id as string,
    name:               l.name as string,
    address:            l.address as string,
    latitude:           l.latitude as number,
    longitude:          l.longitude as number,
    organizationId:     (l.organization_id ?? l.organizationId) as string,
    workingHoursStart:  (l.working_hours_start ?? l.workingHoursStart ?? '') as string,
    workingHoursEnd:    (l.working_hours_end   ?? l.workingHoursEnd   ?? '') as string,
    geofenceRadius:     (l.geofence_radius     ?? l.geofenceRadius    ?? 200) as number,
    status:             (l.status ?? 'ACTIVE') as WorkLocation['status'],
  };
}

export function mapMember(m: Raw): Member {
  // nested relations come back as arrays from Supabase — take first element
  const org         = m.organization   ? mapOrg(m.organization as Raw)              : undefined;
  const workLoc     = m.workLocation   ? mapWorkLocation(m.workLocation as Raw)     : undefined;
  const lastLocRaw  = Array.isArray(m.lastLocation)
    ? (m.lastLocation as Raw[])[0]
    : m.lastLocation as Raw | undefined;
  const lastLoc     = lastLocRaw       ? mapGPS(lastLocRaw)                         : undefined;
  const attendRaw   = Array.isArray(m.todayAttendance)
    ? (m.todayAttendance as Raw[])[0]
    : m.todayAttendance as Raw | undefined;
  const attendance  = attendRaw        ? mapAttendance(attendRaw)                   : undefined;
  const group       = m.group          ? mapGroup(m.group as Raw)                   : undefined;

  return {
    id:               m.id as string,
    fullName:         (m.full_name        ?? m.fullName)        as string,
    memberId:         (m.member_id        ?? m.memberId)        as string,
    gender:           m.gender            as Member['gender'],
    phone:            m.phone             as string,
    profilePhoto:     (m.profile_photo    ?? m.profilePhoto)    as string | undefined,
    organizationId:   (m.organization_id  ?? m.organizationId)  as string,
    organization:     org,
    groupId:          (m.group_id         ?? m.groupId)         as string | undefined,
    group,
    woredaId:         (m.woreda_id        ?? m.woredaId)        as string | undefined,
    subcityId:        (m.subcity_id       ?? m.subcityId)       as string | undefined,
    jobRole:          (m.job_role         ?? m.jobRole)         as string,
    workAddress:      (m.work_address     ?? m.workAddress)     as string,
    workLocationId:   (m.work_location_id ?? m.workLocationId)  as string | undefined,
    workLocation:     workLoc,
    registrationDate: (m.registration_date ?? m.registrationDate) as string,
    status:           m.status            as Member['status'],
    emergencyContact: (m.emergency_contact ?? m.emergencyContact) as string,
    notes:            m.notes             as string | undefined,
    locationStatus:   (m.location_status  ?? m.locationStatus)  as Member['locationStatus'],
    isSharing:        (m.is_sharing       ?? m.isSharing        ?? false) as boolean,
    lastLocation:     lastLoc,
    todayAttendance:  attendance,
  };
}

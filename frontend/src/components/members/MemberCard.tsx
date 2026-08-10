import { Phone, MapPin, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Member } from '../../types';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import clsx from 'clsx';

interface MemberCardProps { member: Member; }

const locationStatusConfig = {
  AT_WORK: { label: 'At Work', variant: 'success' as const, dot: true },
  NEARBY: { label: 'Nearby', variant: 'warning' as const, dot: true },
  OUTSIDE: { label: 'Outside Area', variant: 'danger' as const, dot: true },
  OFFLINE: { label: 'Offline', variant: 'default' as const, dot: false },
};

const attendanceConfig = {
  PRESENT: { label: 'Present', variant: 'success' as const },
  ABSENT: { label: 'Absent', variant: 'danger' as const },
  LATE: { label: 'Late', variant: 'warning' as const },
  CHECKED_OUT: { label: 'Checked Out', variant: 'info' as const },
  WORKING: { label: 'Working', variant: 'success' as const },
};

const memberStatusConfig = {
  ACTIVE: { label: 'Active', variant: 'success' as const },
  INACTIVE: { label: 'Inactive', variant: 'default' as const },
  SUSPENDED: { label: 'Suspended', variant: 'danger' as const },
};

export default function MemberCard({ member }: MemberCardProps) {
  const navigate = useNavigate();
  const locStatus = member.locationStatus ? locationStatusConfig[member.locationStatus] : null;
  const attStatus = member.todayAttendance?.status ? attendanceConfig[member.todayAttendance.status] : null;
  const memStatus = memberStatusConfig[member.status];

  return (
    <div
      onClick={() => navigate(`/members/${member.id}`)}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer p-4 flex flex-col gap-3 group"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar src={member.profilePhoto} name={member.fullName} size="lg" online={member.isSharing} />
          <div
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800"
            style={{ backgroundColor: member.organization?.color ?? '#6B7280' }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate group-hover:text-green-600 transition-colors">
            {member.fullName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.memberId}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{member.jobRole}</p>
        </div>
        <Badge label={memStatus.label} variant={memStatus.variant} size="sm" />
      </div>

      {/* Org */}
      <div
        className={clsx('px-2 py-1 rounded-lg text-xs font-medium')}
        style={{ backgroundColor: member.organization?.color + '20', color: member.organization?.color }}
      >
        {member.organization?.name}
      </div>

      {/* Info */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Phone size={12} className="shrink-0" />
          <span className="truncate">{member.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <MapPin size={12} className="shrink-0" />
          <span className="truncate">{member.workAddress}</span>
        </div>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-100 dark:border-gray-700">
        {locStatus && <Badge label={locStatus.label} variant={locStatus.variant} dot={locStatus.dot} />}
        {attStatus && <Badge label={attStatus.label} variant={attStatus.variant} />}
        {member.isSharing && (
          <span className="inline-flex items-center gap-1 text-[10px] text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-full font-medium">
            <Navigation size={10} />GPS
          </span>
        )}
      </div>
    </div>
  );
}

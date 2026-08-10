import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Users, UserCheck, Briefcase, MapPin } from 'lucide-react';
import { ORGANIZATIONS, MEMBERS, WORK_LOCATIONS } from '../data/mockData';
import MemberCard from '../components/members/MemberCard';
import Card from '../components/common/Card';
import AttendanceChart from '../components/charts/AttendanceChart';

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const org = ORGANIZATIONS.find(o => o.id === id);
  const members = MEMBERS.filter(m => m.organizationId === id);
  const locations = WORK_LOCATIONS.filter(l => l.organizationId === id);

  if (!org) return <div className="p-8 text-gray-400">Organization not found</div>;

  const working = members.filter(m => m.todayAttendance?.status === 'PRESENT' || m.todayAttendance?.status === 'LATE').length;
  const onMap = members.filter(m => m.isSharing).length;
  const active = members.filter(m => m.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Back button + Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: org.color + '20' }}>
            {org.icon}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-ethiopic">{org.name}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{org.nameEn}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Users, label: t('orgs.totalMembers'), value: members.length, color: org.color },
          { icon: UserCheck, label: t('orgs.activeMembers'), value: active, color: '#22C55E' },
          { icon: Briefcase, label: t('orgs.working'), value: working, color: '#A855F7' },
          { icon: MapPin, label: t('orgs.onMap'), value: onMap, color: '#14B8A6' },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label} className="text-center">
            <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
              <Icon size={18} style={{ color }} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Attendance chart */}
        <Card className="xl:col-span-2">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('attendance.summary')}</h3>
          <AttendanceChart />
        </Card>

        {/* Work locations */}
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('workLocations.title')}</h3>
          <div className="space-y-3">
            {locations.length === 0 ? (
              <p className="text-sm text-gray-400">{t('common.none')}</p>
            ) : locations.map(loc => (
              <div key={loc.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <p className="font-medium text-sm text-gray-900 dark:text-white">{loc.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{loc.address}</p>
                <p className="text-xs text-gray-400 mt-0.5">{loc.workingHoursStart} – {loc.workingHoursEnd}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Member grid */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('members.title')} ({members.length})</h3>
        {members.length === 0 ? (
          <p className="text-gray-400">{t('members.noMembers')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {members.map(m => <MemberCard key={m.id} member={m} />)}
          </div>
        )}
      </div>
    </div>
  );
}

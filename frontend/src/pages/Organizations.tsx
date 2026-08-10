import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, UserCheck, Briefcase, Map } from 'lucide-react';
import { ORGANIZATIONS, MEMBERS } from '../data/mockData';

export default function Organizations() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('orgs.title')}</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('orgs.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {ORGANIZATIONS.map(org => {
          const members = MEMBERS.filter(m => m.organizationId === org.id);
          const working = members.filter(m => m.todayAttendance?.status === 'PRESENT' || m.todayAttendance?.status === 'LATE').length;
          const onMap = members.filter(m => m.isSharing).length;

          return (
            <div
              key={org.id}
              onClick={() => navigate(`/organizations/${org.id}`)}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
            >
              {/* Top accent */}
              <div className="h-2" style={{ backgroundColor: org.color }} />

              <div className="p-6">
                {/* Header */}
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm" style={{ backgroundColor: org.color + '20' }}>
                    {org.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white font-ethiopic group-hover:text-green-600 transition-colors">{org.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{org.nameEn}</p>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Users, label: t('orgs.totalMembers'), value: members.length, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    { icon: UserCheck, label: t('orgs.activeMembers'), value: org.activeCount, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
                    { icon: Briefcase, label: t('orgs.working'), value: working, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                    { icon: Map, label: t('orgs.onMap'), value: onMap, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20' },
                  ].map(({ icon: Icon, label, value, color, bg }) => (
                    <div key={label} className={`rounded-xl p-3 ${bg}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon size={13} className={color} />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
                      </div>
                      <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>

                <button
                  className="mt-4 w-full py-2 rounded-xl text-sm font-medium transition-colors"
                  style={{ backgroundColor: org.color + '15', color: org.color }}
                >
                  {t('orgs.viewAll')} →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

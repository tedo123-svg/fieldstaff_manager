import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, UserCheck, Briefcase, Map } from 'lucide-react';
import type { Organization } from '../types';
import { supabase } from '../lib/supabase';

interface OrgWithStats extends Organization {
  membersCount: number;
  workingCount: number;
  onMapCount: number;
}

export default function Organizations() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<OrgWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('organizations')
        .select('*, members(id, status, is_sharing, todayAttendance:attendances(status))');

      if (data) {
        const mapped: OrgWithStats[] = (data as unknown[]).map((org: unknown) => {
          const o = org as Organization & { members: { status: string; is_sharing: boolean; todayAttendance?: { status: string } }[] };
          const members = o.members ?? [];
          return {
            ...o,
            membersCount: members.length,
            workingCount: members.filter(m => m.todayAttendance?.status === 'PRESENT' || m.todayAttendance?.status === 'LATE').length,
            onMapCount: members.filter(m => m.is_sharing).length,
          };
        });
        setOrgs(mapped);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('orgs.title')}</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('orgs.subtitle')}</p>
      </div>

      {orgs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No organizations found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {orgs.map(org => (
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
                    { icon: Users, label: t('orgs.totalMembers'), value: org.membersCount, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    { icon: UserCheck, label: t('orgs.activeMembers'), value: org.activeCount, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
                    { icon: Briefcase, label: t('orgs.working'), value: org.workingCount, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                    { icon: Map, label: t('orgs.onMap'), value: org.onMapCount, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20' },
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
          ))}
        </div>
      )}
    </div>
  );
}

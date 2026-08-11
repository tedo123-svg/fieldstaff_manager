import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Users, UserCheck, Briefcase, MapPin, ChevronDown, ChevronRight } from 'lucide-react';
import type { Organization, Member, WorkLocation, Group } from '../types';
import MemberCard from '../components/members/MemberCard';
import Card from '../components/common/Card';
import AttendanceChart from '../components/charts/AttendanceChart';
import { supabase } from '../lib/supabase';

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      const [{ data: orgData }, { data: membersData }, { data: locsData }, { data: grpsData }] = await Promise.all([
        supabase.from('organizations').select('*').eq('id', id).single(),
        supabase.from('members').select(`
          *,
          organization:organizations(*),
          group:groups(*),
          woreda:woredas(*),
          subcity:subcities(*),
          workLocation:work_locations(*),
          lastLocation:gps_locations(*),
          todayAttendance:attendances(*)
        `).eq('organization_id', id),
        supabase.from('work_locations').select('*').eq('organization_id', id),
        supabase.from('groups').select('*').eq('organization_id', id).order('name'),
      ]);
      if (orgData) setOrg(orgData as Organization);
      if (membersData) setMembers(membersData as Member[]);
      if (locsData) setLocations(locsData as WorkLocation[]);
      if (grpsData) {
        const grps = grpsData as Group[];
        setGroups(grps);
        // expand all groups by default
        setExpandedGroups(new Set(grps.map(g => g.id)));
      }
      setLoading(false);
    }
    load();
  }, [id]);

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

  if (!org) return <div className="p-8 text-gray-400">Organization not found</div>;

  const working = members.filter(m => m.todayAttendance?.status === 'PRESENT' || m.todayAttendance?.status === 'LATE').length;
  const onMap   = members.filter(m => m.isSharing).length;
  const active  = members.filter(m => m.status === 'ACTIVE').length;

  const toggleGroup = (gId: string) =>
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(gId) ? next.delete(gId) : next.add(gId);
      return next;
    });

  // Members that belong to no group (for orgs without groups, or ungrouped members)
  const ungroupedMembers = members.filter(m => !m.groupId);

  return (
    <div className="space-y-6">
      {/* Back + Header */}
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
          { icon: Users,     label: t('orgs.totalMembers'),  value: members.length, color: org.color },
          { icon: UserCheck, label: t('orgs.activeMembers'), value: active,         color: '#22C55E' },
          { icon: Briefcase, label: t('orgs.working'),       value: working,        color: '#A855F7' },
          { icon: MapPin,    label: t('orgs.onMap'),         value: onMap,          color: '#14B8A6' },
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
        <Card className="xl:col-span-2">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('attendance.summary')}</h3>
          <AttendanceChart />
        </Card>

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

      {/* Members — grouped view for orgs that have groups */}
      {org.hasGroups && groups.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            ቡድኖች (Groups) — {groups.length} groups, {members.length} members
          </h3>

          {groups.map(group => {
            const groupMembers = members.filter(m => m.groupId === group.id);
            const isExpanded = expandedGroups.has(group.id);
            const hasMinMembers = groupMembers.length >= 2;

            return (
              <div key={group.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                >
                  {isExpanded ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />}
                  <span className="font-semibold text-gray-900 dark:text-white flex-1">{group.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${hasMinMembers ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                    {groupMembers.length} {groupMembers.length === 1 ? 'member' : 'members'}
                    {!hasMinMembers && ' ⚠ min 2 required'}
                  </span>
                </button>

                {/* Group members */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700">
                    {groupMembers.length === 0 ? (
                      <p className="text-sm text-gray-400 py-4 text-center">No members in this group yet</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-4">
                        {groupMembers.map(m => <MemberCard key={m.id} member={m} />)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Ungrouped members warning */}
          {ungroupedMembers.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400 mb-3">
                ⚠ {ungroupedMembers.length} member(s) not assigned to a group
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {ungroupedMembers.map(m => <MemberCard key={m.id} member={m} />)}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Flat list for orgs 4 & 5 */
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            {t('members.title')} ({members.length})
          </h3>
          {members.length === 0 ? (
            <p className="text-gray-400">{t('members.noMembers')}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {members.map(m => <MemberCard key={m.id} member={m} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

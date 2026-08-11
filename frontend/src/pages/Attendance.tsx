import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserCheck, UserX, Clock, Briefcase } from 'lucide-react';
import type { Attendance as AttendanceType, Organization, Woreda, Group } from '../types';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Avatar from '../components/common/Avatar';
import SearchBar from '../components/common/SearchBar';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';

const today = new Date().toISOString().slice(0, 10);

export default function Attendance() {
  const { t } = useTranslation();
  const [date, setDate] = useState(today);
  const [orgFilter, setOrgFilter] = useState('');
  const [woredaFilter, setWoredaFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState<AttendanceType[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [allWoredas, setAllWoredas] = useState<Woreda[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('organizations').select('*'),
      supabase.from('woredas').select('*').order('name'),
      supabase.from('groups').select('*').order('name'),
    ]).then(([{ data: orgs }, { data: wr }, { data: grps }]) => {
      if (orgs)  setOrganizations(orgs as Organization[]);
      if (wr)    setAllWoredas(wr as Woreda[]);
      if (grps)  setAllGroups(grps as Group[]);
    });
  }, []);

  // Groups visible based on selected org filter
  const visibleGroups = allGroups.filter(g =>
    !orgFilter || g.organizationId === orgFilter
  );

  useEffect(() => {
    async function loadAttendance() {
      setLoading(true);
      let query = supabase
        .from('attendances')
        .select('*, member:members(*, organization:organizations(*))')
        .eq('date', date);

      if (orgFilter)    query = query.eq('member.organizationId', orgFilter);
      if (woredaFilter) query = query.eq('member.woredaId', woredaFilter);
      if (groupFilter)  query = query.eq('member.groupId', groupFilter);
      if (statusFilter) query = query.eq('status', statusFilter);

      const { data } = await query;
      if (data) {
        let filtered = data as AttendanceType[];
        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter(a =>
            a.member?.fullName.toLowerCase().includes(q) || a.member?.memberId.toLowerCase().includes(q)
          );
        }
        setRecords(filtered);
      }
      setLoading(false);
    }
    loadAttendance();
  }, [date, orgFilter, woredaFilter, groupFilter, statusFilter, search]);

  const summary = {
    present: records.filter(r => r.status === 'PRESENT').length,
    absent: records.filter(r => r.status === 'ABSENT').length,
    late: records.filter(r => r.status === 'LATE').length,
    checkedOut: records.filter(r => r.status === 'CHECKED_OUT').length,
  };

  const statusVariant = {
    PRESENT: 'success' as const,
    ABSENT: 'danger' as const,
    LATE: 'warning' as const,
    CHECKED_OUT: 'info' as const,
    WORKING: 'success' as const,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('attendance.title')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{records.length} records for {format(new Date(date + 'T00:00:00'), 'dd MMM yyyy')}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t('status.present'), value: summary.present, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
          { label: t('status.absent'), value: summary.absent, icon: UserX, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
          { label: t('status.late'), value: summary.late, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
          { label: t('status.checkedOut'), value: summary.checkedOut, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${bg}`}><Icon size={20} className={color} /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="date" value={date} onChange={e => setDate(e.target.value)}
          className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select value={woredaFilter} onChange={e => setWoredaFilter(e.target.value)}
          className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">All Woredas</option>
          {allWoredas.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <select value={orgFilter} onChange={e => { setOrgFilter(e.target.value); setGroupFilter(''); }}
          className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">{t('common.all')} {t('orgs.title')}</option>
          {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)}
          className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">All Groups</option>
          {visibleGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">{t('common.all')} Status</option>
          <option value="PRESENT">{t('status.present')}</option>
          <option value="ABSENT">{t('status.absent')}</option>
          <option value="LATE">{t('status.late')}</option>
          <option value="CHECKED_OUT">{t('status.checkedOut')}</option>
        </select>
        <SearchBar value={search} onChange={setSearch} placeholder={t('common.search') + '...'} className="w-48" />
      </div>

      {/* Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {[t('attendance.member'), 'Woreda / Group', 'Organization', t('attendance.date'), 'Check In', 'Check Out', t('members.status')].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">{t('attendance.noRecords')}</td></tr>
                ) : records.map(r => (
                  <tr key={r.id} className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={r.member?.profilePhoto} name={r.member?.fullName ?? '?'} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{r.member?.fullName}</p>
                          <p className="text-xs text-gray-400 font-mono">{r.member?.memberId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-xs text-gray-600 dark:text-gray-300">{r.member?.woreda?.name ?? '–'}</p>
                      {r.member?.group && <p className="text-xs text-gray-400">{r.member.group.name}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: r.member?.organization?.color + '20', color: r.member?.organization?.color }}>
                        {r.member?.organization?.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">{format(new Date(r.date + 'T00:00:00'), 'dd MMM yyyy')}</td>
                    <td className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">{r.checkIn ?? '–'}</td>
                    <td className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300">{r.checkOut ?? '–'}</td>
                    <td className="py-3 px-4"><Badge label={r.status} variant={statusVariant[r.status]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}

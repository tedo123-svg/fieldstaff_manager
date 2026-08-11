import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, LayoutGrid, List, SlidersHorizontal, Users, Link as LinkIcon } from 'lucide-react';
import type { Member, Organization, Subcity, Woreda, Group, MemberFilters } from '../types';
import MemberCard from '../components/members/MemberCard';
import Modal from '../components/common/Modal';
import MemberForm from '../components/members/MemberForm';
import SearchBar from '../components/common/SearchBar';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Avatar from '../components/common/Avatar';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';
import { mapMember, mapOrg, mapWoreda, mapGroup } from '../lib/mappers';

// ── Defined OUTSIDE the component so React never remounts it ──────────────
// Defining components inside another component causes them to be seen as a
// new type on every render, which unmounts/remounts the element and kills focus.
function SelectFilter({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function Members() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [members, setMembers] = useState<Member[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [subcities, setSubcities] = useState<Subcity[]>([]);
  const [allWoredas, setAllWoredas] = useState<Woreda[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [addOpen, setAddOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<MemberFilters>({
    search: '', organizationId: '', subcityId: '', woredaId: '', groupId: '',
    status: '', locationStatus: '', attendanceStatus: '', isSharing: '',
  });

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: membersData } = await supabase.from('members').select(`
        *,
        organization:organizations(*),
        workLocation:work_locations(*),
        lastLocation:gps_locations(*),
        todayAttendance:attendances(*)
      `);

      const { data: orgsData }    = await supabase.from('organizations').select('*');
      const { data: scData }      = await supabase.from('subcities').select('*').order('name');
      const { data: wrData }      = await supabase.from('woredas').select('*, subcity:subcities(*)').order('name');
      const { data: grpData }     = await supabase.from('groups').select('*').order('name');

      if (membersData) setMembers((membersData as Record<string, unknown>[]).map(mapMember));
      if (orgsData)    setOrganizations((orgsData as Record<string, unknown>[]).map(mapOrg));
      if (scData)      setSubcities(scData as Subcity[]);
      if (wrData)      setAllWoredas((wrData as Record<string, unknown>[]).map(mapWoreda));
      if (grpData)     setAllGroups((grpData as Record<string, unknown>[]).map(mapGroup));
      setLoading(false);
    }
    load();
  }, []);

  // Derived dependent filter lists
  const filteredWoredas = allWoredas.filter(
    w => !filters.subcityId || w.subcityId === filters.subcityId
  );
  const filteredGroups = allGroups.filter(
    g =>
      (!filters.organizationId || g.organizationId === filters.organizationId) &&
      (!filters.woredaId || g.woredaId === filters.woredaId)
  );

  const filtered = members.filter(m => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !m.fullName.toLowerCase().includes(q) &&
        !m.memberId.toLowerCase().includes(q) &&
        !m.phone.includes(q)
      ) return false;
    }
    if (filters.subcityId      && m.subcityId      !== filters.subcityId)                     return false;
    if (filters.woredaId       && m.woredaId       !== filters.woredaId)                      return false;
    if (filters.organizationId && m.organizationId !== filters.organizationId)                return false;
    if (filters.groupId        && m.groupId        !== filters.groupId)                       return false;    if (filters.status         && m.status         !== filters.status)                        return false;
    if (filters.locationStatus && m.locationStatus !== filters.locationStatus)                return false;
    if (filters.attendanceStatus && m.todayAttendance?.status !== filters.attendanceStatus)   return false;
    if (filters.isSharing === 'yes' && !m.isSharing)  return false;
    if (filters.isSharing === 'no'  &&  m.isSharing)  return false;
    return true;
  });

  const handleAdd = async (data: Partial<Member>) => {
    const { data: inserted, error } = await supabase
      .from('members')
      .insert([{
        full_name:         data.fullName,
        member_id:         data.memberId,
        gender:            data.gender,
        phone:             data.phone,
        profile_photo:     data.profilePhoto,
        subcity_id:        data.subcityId        || null,
        woreda_id:         data.woredaId         || null,
        organization_id:   data.organizationId,
        group_id:          data.groupId          || null,
        job_role:          data.jobRole,
        work_address:      data.workAddress,
        work_location_id:  data.workLocationId   || null,
        registration_date: data.registrationDate,
        status:            data.status,
        emergency_contact: data.emergencyContact,
        notes:             data.notes,
      }])
      .select('*, organization:organizations(*)')
      .single();

    if (error) { toast.error('Failed to add member'); return; }
    setMembers(p => [inserted as Member, ...p]);
    setAddOpen(false);
    toast.success(`${data.fullName} added successfully!`);
  };

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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('members.title')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filtered.length} {t('members.title').toLowerCase()}
          </p>
        </div>
        <Button
          variant="outline" size="sm"
          icon={<LinkIcon size={14} />}
          onClick={() => {
            const url = `${window.location.origin}/track.html`;
            navigator.clipboard.writeText(url).then(() =>
              toast.success('Tracking link copied! Share with members.')
            );
          }}
        >
          Copy Tracking Link
        </Button>
        <Button icon={<UserPlus size={16} />} onClick={() => setAddOpen(true)}>
          {t('members.addMember')}
        </Button>
      </div>

      {/* Search + toolbar */}
      <div className="flex gap-3 flex-wrap">
        <SearchBar
          value={filters.search}
          onChange={v => setFilters(p => ({ ...p, search: v }))}
          placeholder={t('common.search') + '...'}
          className="flex-1 min-w-48"
        />
        <Button
          variant="outline" size="sm"
          icon={<SlidersHorizontal size={14} />}
          onClick={() => setShowFilters(p => !p)}
        >
          {t('common.filter')}
        </Button>
        <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
          <button
            onClick={() => setView('grid')}
            className={clsx('p-2', view === 'grid' ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700')}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setView('list')}
            className={clsx('p-2', view === 'list' ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700')}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          {/* Hierarchy row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SelectFilter
              label="ክፍለ ከተማ (Subcity)"
              value={filters.subcityId}
              onChange={v => setFilters(p => ({ ...p, subcityId: v, woredaId: '', groupId: '' }))}
              options={[{ value: '', label: t('common.all') }, ...subcities.map(s => ({ value: s.id, label: s.name }))]}
            />
            <SelectFilter
              label="ወረዳ (Woreda)"
              value={filters.woredaId}
              onChange={v => setFilters(p => ({ ...p, woredaId: v, groupId: '' }))}
              options={[{ value: '', label: t('common.all') }, ...filteredWoredas.map(w => ({ value: w.id, label: w.name }))]}
            />
            <SelectFilter
              label={t('members.organization')}
              value={filters.organizationId}
              onChange={v => setFilters(p => ({ ...p, organizationId: v, groupId: '' }))}
              options={[{ value: '', label: t('common.all') }, ...organizations.map(o => ({ value: o.id, label: o.name }))]}
            />
            <SelectFilter
              label="ቡድን (Group)"
              value={filters.groupId}
              onChange={v => setFilters(p => ({ ...p, groupId: v }))}
              options={[{ value: '', label: t('common.all') }, ...filteredGroups.map(g => ({ value: g.id, label: g.name }))]}
            />
          </div>
          {/* Status row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SelectFilter
              label={t('members.status')} value={filters.status}
              onChange={v => setFilters(p => ({ ...p, status: v }))}
              options={[{ value: '', label: t('common.all') }, { value: 'ACTIVE', label: t('status.active') }, { value: 'INACTIVE', label: t('status.inactive') }, { value: 'SUSPENDED', label: t('status.suspended') }]}
            />
            <SelectFilter
              label="Location" value={filters.locationStatus}
              onChange={v => setFilters(p => ({ ...p, locationStatus: v }))}
              options={[{ value: '', label: t('common.all') }, { value: 'AT_WORK', label: t('status.atWork') }, { value: 'NEARBY', label: t('status.nearby') }, { value: 'OUTSIDE', label: t('status.outside') }, { value: 'OFFLINE', label: t('status.offline') }]}
            />
            <SelectFilter
              label={t('attendance.title')} value={filters.attendanceStatus}
              onChange={v => setFilters(p => ({ ...p, attendanceStatus: v }))}
              options={[{ value: '', label: t('common.all') }, { value: 'PRESENT', label: t('status.present') }, { value: 'ABSENT', label: t('status.absent') }, { value: 'LATE', label: t('status.late') }]}
            />
            <SelectFilter
              label="GPS" value={filters.isSharing}
              onChange={v => setFilters(p => ({ ...p, isSharing: v }))}
              options={[{ value: '', label: t('common.all') }, { value: 'yes', label: 'Sharing' }, { value: 'no', label: 'Not Sharing' }]}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users size={48} className="mx-auto mb-3 opacity-30" />
          <p>{t('members.noMembers')}</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(m => <MemberCard key={m.id} member={m} />)}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                {['Member', 'ID', 'Subcity / Woreda', 'Organization / Group', 'Phone', 'Status', 'GPS'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr
                  key={m.id}
                  onClick={() => navigate(`/members/${m.id}`)}
                  className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Avatar src={m.profilePhoto} name={m.fullName} size="sm" online={m.isSharing} />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{m.fullName}</p>
                        <p className="text-xs text-gray-400">{m.jobRole}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400 font-mono text-xs">{m.memberId}</td>
                  <td className="py-3 px-4">
                    <p className="text-xs text-gray-700 dark:text-gray-300">{m.subcity?.name}</p>
                    <p className="text-xs text-gray-400">{m.woreda?.name}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full block w-fit"
                      style={{ backgroundColor: m.organization?.color + '20', color: m.organization?.color }}>
                      {m.organization?.name}
                    </span>
                    {m.group && <p className="text-xs text-gray-400 mt-0.5">{m.group.name}</p>}
                  </td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{m.phone}</td>
                  <td className="py-3 px-4">
                    <Badge label={m.status} variant={m.status === 'ACTIVE' ? 'success' : m.status === 'INACTIVE' ? 'default' : 'danger'} />
                  </td>
                  <td className="py-3 px-4">
                    {m.isSharing
                      ? <span className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">Live</span>
                      : <span className="text-xs text-gray-400">Offline</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={t('members.addMember')} size="lg">
        <MemberForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} />
      </Modal>
    </div>
  );
}

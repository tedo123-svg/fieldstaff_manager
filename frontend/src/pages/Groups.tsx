import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Users, ChevronDown, ChevronRight } from 'lucide-react';
import type { Group, Organization, Subcity, Woreda } from '../types';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';

// Only orgs 1,2,3 support groups — enforced by hasGroups flag on org
function SelectEl({ label, value, onChange, disabled, children }: {
  label: string; value: string; onChange: (v: string) => void;
  disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <select
        value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
      >
        {children}
      </select>
    </div>
  );
}

interface GroupWithCount extends Group {
  memberCount: number;
}

interface GroupForm {
  name: string;
  organizationId: string;
  subcityId: string;
  woredaId: string;
}

const EMPTY_FORM: GroupForm = { name: '', organizationId: '', subcityId: '', woredaId: '' };

export default function Groups() {
  const { t } = useTranslation();

  const [groups, setGroups] = useState<GroupWithCount[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [subcities, setSubcities] = useState<Subcity[]>([]);
  const [allWoredas, setAllWoredas] = useState<Woreda[]>([]);
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GroupWithCount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GroupWithCount | null>(null);
  const [form, setForm] = useState<GroupForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Filter state
  const [filterOrg, setFilterOrg] = useState('');
  const [filterSubcity, setFilterSubcity] = useState('');
  const [filterWoreda, setFilterWoreda] = useState('');

  // Expand/collapse per org
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());

  const woredas = allWoredas.filter(w => !form.subcityId || w.subcityId === form.subcityId);
  const filteredWoredas = allWoredas.filter(w => !filterSubcity || w.subcityId === filterSubcity);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [{ data: grps }, { data: orgData }, { data: sc }, { data: wr }] = await Promise.all([
      supabase.from('groups').select('*, memberCount:members(count)').order('name'),
      supabase.from('organizations').select('*').eq('has_groups', true).order('name'),
      supabase.from('subcities').select('*').order('name'),
      supabase.from('woredas').select('*').order('name'),
    ]);
    if (grps) {
      setGroups(grps.map((g: Group & { memberCount: { count: number }[] }) => ({
        ...g,
        memberCount: g.memberCount?.[0]?.count ?? 0,
      })));
    }
    if (orgData) {
      setOrgs(orgData as Organization[]);
      setExpandedOrgs(new Set((orgData as Organization[]).map(o => o.id)));
    }
    if (sc) setSubcities(sc as Subcity[]);
    if (wr) setAllWoredas(wr as Woreda[]);
    setLoading(false);
  }

  const handleAdd = async () => {
    if (!form.name.trim() || !form.organizationId || !form.woredaId) {
      toast.error('Name, organization and woreda are required'); return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from('groups')
      .insert([{ name: form.name, organization_id: form.organizationId, woreda_id: form.woredaId }])
      .select('*')
      .single();
    setSaving(false);
    if (error) { toast.error('Failed to create group'); return; }
    setGroups(p => [...p, { ...(data as Group), memberCount: 0 }]);
    setAddOpen(false);
    setForm(EMPTY_FORM);
    toast.success('Group created');
  };

  const handleEdit = async () => {
    if (!editTarget || !form.name.trim() || !form.organizationId || !form.woredaId) {
      toast.error('Name, organization and woreda are required'); return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from('groups')
      .update({ name: form.name, organization_id: form.organizationId, woreda_id: form.woredaId })
      .eq('id', editTarget.id)
      .select('*')
      .single();
    setSaving(false);
    if (error) { toast.error('Failed to update group'); return; }
    setGroups(p => p.map(g => g.id === editTarget.id ? { ...(data as Group), memberCount: editTarget.memberCount } : g));
    setEditTarget(null);
    setForm(EMPTY_FORM);
    toast.success('Group updated');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.memberCount > 0) {
      toast.error('Cannot delete a group that still has members'); return;
    }
    const { error } = await supabase.from('groups').delete().eq('id', deleteTarget.id);
    if (error) { toast.error('Failed to delete group'); return; }
    setGroups(p => p.filter(g => g.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success('Group deleted');
  };

  const openEdit = (g: GroupWithCount) => {
    setEditTarget(g);
    setForm({
      name: g.name,
      organizationId: g.organizationId,
      subcityId: g.woreda?.subcityId ?? '',
      woredaId: g.woredaId,
    });
  };

  const toggleOrg = (id: string) =>
    setExpandedOrgs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Apply filters
  const visibleGroups = groups.filter(g =>
    (!filterOrg || g.organizationId === filterOrg) &&
    (!filterWoreda || g.woredaId === filterWoreda)
  );

  const GroupForm = () => (
    <div className="space-y-4">
      <Input
        label="Group Name *"
        value={form.name}
        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
        placeholder="e.g. ቡድን ፩"
      />
      <SelectEl label="Organization *" value={form.organizationId} onChange={v => setForm(p => ({ ...p, organizationId: v }))}>
        <option value="">-- Select Organization --</option>
        {orgs.map(o => <option key={o.id} value={o.id}>{o.name} ({o.nameEn})</option>)}
      </SelectEl>
      <SelectEl label="ክፍለ ከተማ (Subcity)" value={form.subcityId} onChange={v => setForm(p => ({ ...p, subcityId: v, woredaId: '' }))}>
        <option value="">-- Select Subcity --</option>
        {subcities.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </SelectEl>
      <SelectEl label="ወረዳ (Woreda) *" value={form.woredaId} onChange={v => setForm(p => ({ ...p, woredaId: v }))} disabled={!form.subcityId}>
        <option value="">-- Select Woreda --</option>
        {woredas.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
      </SelectEl>
    </div>
  );

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ቡድኖች (Groups)</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {visibleGroups.length} groups — organizations 1, 2 &amp; 3 only (min 2 members each)
          </p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => { setForm(EMPTY_FORM); setAddOpen(true); }}>
          Add Group
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filterOrg} onChange={e => setFilterOrg(e.target.value)}
          className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">All Organizations</option>
          {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <select value={filterSubcity} onChange={e => { setFilterSubcity(e.target.value); setFilterWoreda(''); }}
          className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">All Subcities</option>
          {subcities.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterWoreda} onChange={e => setFilterWoreda(e.target.value)}
          className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">All Woredas</option>
          {filteredWoredas.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>

      {/* Groups grouped by organization */}
      {orgs.map(org => {
        const orgGroups = visibleGroups.filter(g => g.organizationId === org.id);
        if (orgGroups.length === 0 && filterOrg && filterOrg !== org.id) return null;
        const isExpanded = expandedOrgs.has(org.id);
        const underMin = orgGroups.filter(g => g.memberCount < 2).length;

        return (
          <div key={org.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Org header row */}
            <button
              onClick={() => toggleOrg(org.id)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors text-left border-b border-gray-100 dark:border-gray-700"
            >
              {isExpanded ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />}
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: org.color }} />
              <span className="font-semibold text-gray-900 dark:text-white flex-1">{org.name}</span>
              <span className="text-xs text-gray-500">{org.nameEn}</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                {orgGroups.length} groups
              </span>
              {underMin > 0 && (
                <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                  ⚠ {underMin} under min
                </span>
              )}
            </button>

            {isExpanded && (
              <div className="p-4">
                {orgGroups.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No groups yet for this organization</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {orgGroups.map(g => (
                      <Card key={g.id} className="relative group/card">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{g.name}</p>
                            {g.woreda && (
                              <p className="text-xs text-gray-400 mt-0.5">{g.woreda.name}</p>
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEdit(g)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-600"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(g)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <Users size={13} className="text-gray-400" />
                          <span className={clsx(
                            'text-xs font-medium',
                            g.memberCount >= 2 ? 'text-green-600' : 'text-red-500'
                          )}>
                            {g.memberCount} member{g.memberCount !== 1 ? 's' : ''}
                          </span>
                          {g.memberCount < 2 && (
                            <Badge label="min 2 required" variant="danger" size="sm" />
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {visibleGroups.length === 0 && !loading && (
        <div className="text-center py-16 text-gray-400">
          <Users size={48} className="mx-auto mb-3 opacity-30" />
          <p>No groups found. Add the first group above.</p>
        </div>
      )}

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Group" size="sm"
        footer={<><Button variant="outline" onClick={() => setAddOpen(false)}>{t('common.cancel')}</Button><Button onClick={handleAdd} loading={saving}>{t('common.save')}</Button></>}>
        <GroupForm />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Group" size="sm"
        footer={<><Button variant="outline" onClick={() => setEditTarget(null)}>{t('common.cancel')}</Button><Button onClick={handleEdit} loading={saving}>{t('common.save')}</Button></>}>
        <GroupForm />
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Group" size="sm"
        footer={<><Button variant="outline" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button><Button variant="danger" onClick={handleDelete}>Delete</Button></>}>
        <p className="text-gray-600 dark:text-gray-300">
          Delete group <strong>{deleteTarget?.name}</strong>?
          {deleteTarget && deleteTarget.memberCount > 0 && (
            <span className="block mt-1 text-red-500 text-sm">This group has {deleteTarget.memberCount} member(s) — reassign them first.</span>
          )}
        </p>
      </Modal>
    </div>
  );
}

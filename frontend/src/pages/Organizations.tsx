import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, UserCheck, Briefcase, Map, Plus, Edit, Trash2 } from 'lucide-react';
import type { Organization } from '../types';
import { supabase } from '../lib/supabase';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import toast from 'react-hot-toast';

// ── Outside component ─────────────────────────────────────────────────────
const COLORS = [
  { label: 'Blue',   value: '#3B82F6' },
  { label: 'Green',  value: '#22C55E' },
  { label: 'Orange', value: '#F97316' },
  { label: 'Purple', value: '#A855F7' },
  { label: 'Red',    value: '#EF4444' },
  { label: 'Teal',   value: '#14B8A6' },
  { label: 'Yellow', value: '#EAB308' },
  { label: 'Pink',   value: '#EC4899' },
];

const ICONS = ['🔵','🟢','🟠','🟣','🔴','🟡','⚪','🟤'];

interface OrgFormValues {
  name: string;
  nameEn: string;
  nameOm: string;
  description: string;
  color: string;
  icon: string;
  hasGroups: boolean;
}

const EMPTY_ORG: OrgFormValues = {
  name: '', nameEn: '', nameOm: '', description: '',
  color: '#3B82F6', icon: '🔵', hasGroups: false,
};

function OrgForm({
  form, setForm,
}: {
  form: OrgFormValues;
  setForm: React.Dispatch<React.SetStateAction<OrgFormValues>>;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          label="ስም (Amharic) *"
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          placeholder="ጫኝ እና አውራጅ"
        />
        <Input
          label="Name (English) *"
          value={form.nameEn}
          onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))}
          placeholder="Loader & Unloader"
        />
        <Input
          label="Maqaa (Oromo)"
          value={form.nameOm}
          onChange={e => setForm(p => ({ ...p, nameOm: e.target.value }))}
          placeholder="Fe'aa fi Buusaa"
        />
      </div>

      <Input
        label="Description"
        value={form.description}
        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
        placeholder="Short description..."
      />

      {/* Color picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color *</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => setForm(p => ({ ...p, color: c.value }))}
              className="w-8 h-8 rounded-full border-4 transition-all"
              style={{
                backgroundColor: c.value,
                borderColor: form.color === c.value ? '#000' : 'transparent',
              }}
              title={c.label}
            />
          ))}
          {/* Custom color */}
          <input
            type="color"
            value={form.color}
            onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
            className="w-8 h-8 rounded-full border border-gray-300 cursor-pointer"
            title="Custom color"
          />
        </div>
      </div>

      {/* Icon picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon</label>
        <div className="flex flex-wrap gap-2">
          {ICONS.map(ic => (
            <button
              key={ic}
              type="button"
              onClick={() => setForm(p => ({ ...p, icon: ic }))}
              className={`w-10 h-10 rounded-xl text-xl transition-all ${
                form.icon === ic
                  ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {ic}
            </button>
          ))}
        </div>
      </div>

      {/* Has groups toggle */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
        <button
          type="button"
          onClick={() => setForm(p => ({ ...p, hasGroups: !p.hasGroups }))}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            form.hasGroups ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.hasGroups ? 'translate-x-5' : ''}`} />
        </button>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">Has Groups (ቡድን አለው)</p>
          <p className="text-xs text-gray-400">Enable for organizations 1, 2 & 3 that have internal groups</p>
        </div>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────

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
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OrgWithStats | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrgWithStats | null>(null);
  const [form, setForm] = useState<OrgFormValues>(EMPTY_ORG);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('organizations')
      .select('*, members(id, status, is_sharing, todayAttendance:attendances(status))');
    if (data) {
      setOrgs((data as unknown[]).map((org: unknown) => {
        const o = org as Organization & { members: { status: string; is_sharing: boolean; todayAttendance?: { status: string } }[] };
        const members = o.members ?? [];
        return {
          ...o,
          membersCount: members.length,
          workingCount: members.filter(m => m.todayAttendance?.status === 'PRESENT' || m.todayAttendance?.status === 'LATE').length,
          onMapCount: members.filter(m => m.is_sharing).length,
        };
      }));
    }
    setLoading(false);
  }

  const handleAdd = async () => {
    if (!form.name.trim() || !form.nameEn.trim()) {
      toast.error('Amharic and English names are required'); return;
    }
    setSaving(true);
    // Only insert columns that exist in the organizations table.
    // We know these work because SELECT * returns them.
    // Try camelCase first (the pattern the rest of the app uses),
    // fall back guidance is in the error message.
    const { data, error } = await supabase.from('organizations').insert([{
      name:        form.name,
      nameEn:      form.nameEn,
      nameOm:      form.nameOm || null,
      description: form.description || null,
      color:       form.color,
      bgColor:     form.color.replace('#', 'bg-[') + ']',
      textColor:   'text-white',
      icon:        form.icon,
      hasGroups:   form.hasGroups,
      memberCount: 0,
      activeCount: 0,
    }]).select().single();
    setSaving(false);
    if (error) {
      // If camelCase fails, the DB uses snake_case — user needs to run the migration
      console.error('Add org error:', error);
      toast.error(`DB error: ${error.message}. Run the SQL migration in supabase/migrations/ first.`);
      return;
    }
    setOrgs(p => [...p, { ...(data as Organization), membersCount: 0, workingCount: 0, onMapCount: 0 }]);
    setAddOpen(false);
    setForm(EMPTY_ORG);
    toast.success('Organization added');
  };

  const handleEdit = async () => {
    if (!editTarget || !form.name.trim() || !form.nameEn.trim()) {
      toast.error('Amharic and English names are required'); return;
    }
    setSaving(true);
    const { data, error } = await supabase.from('organizations').update({
      name:        form.name,
      name_en:     form.nameEn,
      name_om:     form.nameOm,
      description: form.description,
      color:       form.color,
      icon:        form.icon,
      has_groups:  form.hasGroups,
    }).eq('id', editTarget.id).select().single();
    setSaving(false);
    if (error) { toast.error('Failed to update organization'); return; }
    setOrgs(p => p.map(o => o.id === editTarget.id
      ? { ...(data as Organization), membersCount: editTarget.membersCount, workingCount: editTarget.workingCount, onMapCount: editTarget.onMapCount }
      : o));
    setEditTarget(null);
    setForm(EMPTY_ORG);
    toast.success('Organization updated');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.membersCount > 0) {
      toast.error('Cannot delete — organization still has members'); return;
    }
    const { error } = await supabase.from('organizations').delete().eq('id', deleteTarget.id);
    if (error) { toast.error('Failed to delete organization'); return; }
    setOrgs(p => p.filter(o => o.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success('Organization deleted');
  };

  const openEdit = (org: OrgWithStats) => {
    setEditTarget(org);
    setForm({
      name: org.name, nameEn: org.nameEn, nameOm: org.nameOm ?? '',
      description: org.description ?? '', color: org.color,
      icon: org.icon, hasGroups: org.hasGroups,
    });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('orgs.title')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('orgs.subtitle')}</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => { setForm(EMPTY_ORG); setAddOpen(true); }}>
          Add Organization
        </Button>
      </div>

      {orgs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No organizations found. Add the first one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {orgs.map(org => (
            <div
              key={org.id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all overflow-hidden group"
            >
              <div className="h-2" style={{ backgroundColor: org.color }} />
              <div className="p-6">
                {/* Header row */}
                <div className="flex items-start gap-3 mb-5">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm cursor-pointer"
                    style={{ backgroundColor: org.color + '20' }}
                    onClick={() => navigate(`/organizations/${org.id}`)}
                  >
                    {org.icon}
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/organizations/${org.id}`)}>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white font-ethiopic group-hover:text-green-600 transition-colors truncate">{org.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{org.nameEn}</p>
                  </div>
                  {/* Edit / Delete */}
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); openEdit(org); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteTarget(org); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* has_groups badge */}
                {org.hasGroups && (
                  <div className="mb-3">
                    <Badge label="Has Groups" variant="info" size="sm" />
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Users,     label: t('orgs.totalMembers'),  value: org.membersCount, color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    { icon: UserCheck, label: t('orgs.activeMembers'), value: org.activeCount,  color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-900/20' },
                    { icon: Briefcase, label: t('orgs.working'),       value: org.workingCount, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                    { icon: Map,       label: t('orgs.onMap'),         value: org.onMapCount,   color: 'text-teal-600',   bg: 'bg-teal-50 dark:bg-teal-900/20' },
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
                  onClick={() => navigate(`/organizations/${org.id}`)}
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

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Organization" size="lg"
        footer={<><Button variant="outline" onClick={() => setAddOpen(false)}>{t('common.cancel')}</Button><Button onClick={handleAdd} loading={saving}>{t('common.save')}</Button></>}>
        <OrgForm form={form} setForm={setForm} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Organization" size="lg"
        footer={<><Button variant="outline" onClick={() => setEditTarget(null)}>{t('common.cancel')}</Button><Button onClick={handleEdit} loading={saving}>{t('common.save')}</Button></>}>
        <OrgForm form={form} setForm={setForm} />
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Organization" size="sm"
        footer={<><Button variant="outline" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button><Button variant="danger" onClick={handleDelete}>Delete</Button></>}>
        <p className="text-gray-600 dark:text-gray-300">
          Delete <strong>{deleteTarget?.name}</strong>?
          {deleteTarget && deleteTarget.membersCount > 0 && (
            <span className="block mt-1 text-red-500 text-sm">This organization has {deleteTarget.membersCount} member(s) — reassign them first.</span>
          )}
        </p>
      </Modal>
    </div>
  );
}

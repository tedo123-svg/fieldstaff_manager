import { useState, useEffect, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera } from 'lucide-react';
import type { Member, Organization, WorkLocation, Subcity, Woreda, Group } from '../../types';
import { supabase } from '../../lib/supabase';
import Button from '../common/Button';
import Input from '../common/Input';
import clsx from 'clsx';

// Defined outside component — stable references prevent remount on each keystroke
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function SelectWrapper({
  value, onChange, children, error, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={clsx(
          'w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed',
          error ? 'border-red-400' : 'border-gray-300 dark:border-gray-600',
        )}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

interface MemberFormProps {
  initial?: Partial<Member>;
  onSubmit: (data: Partial<Member>) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function MemberForm({ initial, onSubmit, onCancel, loading }: MemberFormProps) {
  const { t } = useTranslation();

  const [form, setForm] = useState<Partial<Member>>({
    fullName: '', memberId: '', gender: 'MALE', phone: '',
    subcityId: '', woredaId: '', organizationId: '', groupId: '',
    jobRole: '', workAddress: '', workLocationId: '',
    registrationDate: new Date().toISOString().slice(0, 10),
    status: 'ACTIVE', emergencyContact: '', notes: '',
    ...initial,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoPreview, setPhotoPreview] = useState<string>(initial?.profilePhoto ?? '');

  // Lookup data
  const [subcities, setSubcities] = useState<Subcity[]>([]);
  const [allWoredas, setAllWoredas] = useState<Woreda[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [workLocations, setWorkLocations] = useState<WorkLocation[]>([]);

  // Derived filtered lists based on selections
  const woredas = allWoredas.filter(w => !form.subcityId || w.subcityId === form.subcityId);
  const selectedOrg = organizations.find(o => o.id === form.organizationId);
  const groups = allGroups.filter(
    g => g.organizationId === form.organizationId && (!form.woredaId || g.woredaId === form.woredaId),
  );

  useEffect(() => {
    Promise.all([
      supabase.from('subcities').select('*').order('name'),
      supabase.from('woredas').select('*').order('name'),
      supabase.from('organizations').select('*').order('name'),
      supabase.from('groups').select('*').order('name'),
      supabase.from('work_locations').select('id, name').order('name'),
    ]).then(([{ data: sc }, { data: wr }, { data: orgs }, { data: grps }, { data: locs }]) => {
      if (sc)   setSubcities(sc as Subcity[]);
      if (wr)   setAllWoredas(wr as Woreda[]);
      if (orgs) setOrganizations(orgs as Organization[]);
      if (grps) setAllGroups(grps as Group[]);
      if (locs) setWorkLocations(locs as WorkLocation[]);
    });
  }, []);

  const set = (k: keyof Member, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  // Reset dependent fields when a parent changes
  const handleSubcityChange = (v: string) => {
    setForm(p => ({ ...p, subcityId: v, woredaId: '', organizationId: '', groupId: '' }));
  };
  const handleWoredaChange = (v: string) => {
    setForm(p => ({ ...p, woredaId: v, organizationId: '', groupId: '' }));
  };
  const handleOrgChange = (v: string) => {
    setForm(p => ({ ...p, organizationId: v, groupId: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName?.trim())        e.fullName        = t('common.required');
    if (!form.memberId?.trim())        e.memberId        = t('common.required');
    if (!form.phone?.trim())           e.phone           = t('common.required');
    if (!form.subcityId)               e.subcityId       = t('common.required');
    if (!form.woredaId)                e.woredaId        = t('common.required');
    if (!form.organizationId)          e.organizationId  = t('common.required');
    if (selectedOrg?.hasGroups && !form.groupId) e.groupId = t('common.required');
    if (!form.jobRole?.trim())         e.jobRole         = t('common.required');
    if (!form.workAddress?.trim())     e.workAddress     = t('common.required');
    if (!form.emergencyContact?.trim()) e.emergencyContact = t('common.required');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit({ ...form, profilePhoto: photoPreview });
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Photo */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden flex items-center justify-center">
            {photoPreview
              ? <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
              : <Camera size={28} className="text-gray-400" />}
          </div>
          <label className="absolute bottom-0 right-0 bg-green-600 hover:bg-green-700 text-white rounded-full p-1.5 cursor-pointer shadow">
            <Camera size={12} />
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </label>
        </div>
        <p className="text-xs text-gray-400">{t('common.upload')}</p>
      </div>

      {/* ── Location Hierarchy ── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Location Hierarchy
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Subcity */}
          <Field label="ክፍለ ከተማ (Subcity)" error={errors.subcityId}>
            <SelectWrapper value={form.subcityId ?? ''} onChange={handleSubcityChange} error={errors.subcityId}>
              <option value="">-- Select Subcity --</option>
              {subcities.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </SelectWrapper>
          </Field>

          {/* Woreda */}
          <Field label="ወረዳ (Woreda)" error={errors.woredaId}>
            <SelectWrapper
              value={form.woredaId ?? ''}
              onChange={handleWoredaChange}
              error={errors.woredaId}
              disabled={!form.subcityId}
            >
              <option value="">-- Select Woreda --</option>
              {woredas.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </SelectWrapper>
          </Field>

          {/* Organization */}
          <Field label={t('members.organization')} error={errors.organizationId}>
            <SelectWrapper
              value={form.organizationId ?? ''}
              onChange={handleOrgChange}
              error={errors.organizationId}
              disabled={!form.woredaId}
            >
              <option value="">-- {t('members.organization')} --</option>
              {organizations.map((o: Organization) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </SelectWrapper>
          </Field>

          {/* Group — only for orgs 1, 2, 3 */}
          {selectedOrg?.hasGroups && (
            <Field label="ቡድን (Group)" error={errors.groupId}>
              <SelectWrapper
                value={form.groupId ?? ''}
                onChange={v => set('groupId', v)}
                error={errors.groupId}
                disabled={!form.organizationId}
              >
                <option value="">-- Select Group --</option>
                {groups.map((g: Group) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </SelectWrapper>
            </Field>
          )}
        </div>
      </div>

      {/* ── Personal Details ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label={t('members.fullName')} required value={form.fullName ?? ''} onChange={e => set('fullName', e.target.value)} error={errors.fullName} />
        <Input label={t('members.memberId')} required value={form.memberId ?? ''} onChange={e => set('memberId', e.target.value)} error={errors.memberId} />

        <Field label={t('members.gender')} error={errors.gender}>
          <SelectWrapper value={form.gender ?? 'MALE'} onChange={v => set('gender', v)}>
            <option value="MALE">{t('members.male')}</option>
            <option value="FEMALE">{t('members.female')}</option>
          </SelectWrapper>
        </Field>

        <Input label={t('members.phone')} required placeholder="+251912345678" value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} error={errors.phone} />
        <Input label={t('members.jobRole')} required value={form.jobRole ?? ''} onChange={e => set('jobRole', e.target.value)} error={errors.jobRole} />
        <Input label={t('members.emergencyContact')} required placeholder="+251911000000" value={form.emergencyContact ?? ''} onChange={e => set('emergencyContact', e.target.value)} error={errors.emergencyContact} />

        <div className="sm:col-span-2">
          <Input label={t('members.workAddress')} required value={form.workAddress ?? ''} onChange={e => set('workAddress', e.target.value)} error={errors.workAddress} />
        </div>

        <Field label={t('members.workLocation')}>
          <SelectWrapper value={form.workLocationId ?? ''} onChange={v => set('workLocationId', v)}>
            <option value="">-- {t('members.workLocation')} --</option>
            {workLocations.map((l: WorkLocation) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </SelectWrapper>
        </Field>

        <Input label={t('members.registrationDate')} type="date" value={form.registrationDate ?? ''} onChange={e => set('registrationDate', e.target.value)} />

        <Field label={t('members.status')}>
          <SelectWrapper value={form.status ?? 'ACTIVE'} onChange={v => set('status', v as Member['status'])}>
            <option value="ACTIVE">{t('status.active')}</option>
            <option value="INACTIVE">{t('status.inactive')}</option>
            <option value="SUSPENDED">{t('status.suspended')}</option>
          </SelectWrapper>
        </Field>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('members.notes')}</label>
          <textarea
            value={form.notes ?? ''}
            onChange={e => set('notes', e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" loading={loading}>{t('common.save')}</Button>
      </div>
    </form>
  );
}

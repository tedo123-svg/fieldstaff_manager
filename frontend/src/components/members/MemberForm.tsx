import { useState, useEffect, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera } from 'lucide-react';
import type { Member, Organization, WorkLocation } from '../../types';
import { supabase } from '../../lib/supabase';
import Button from '../common/Button';
import Input from '../common/Input';
import clsx from 'clsx';

// Defined outside the parent so they are stable references and don't
// trigger unmount/remount on every keystroke (which breaks focus).
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function SelectWrapper({ value, onChange, children, error }: { value: string; onChange: (v: string) => void; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={clsx(
          'w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500',
          error ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'
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
    organizationId: '', jobRole: '', workAddress: '', workLocationId: '',
    registrationDate: new Date().toISOString().slice(0, 10),
    status: 'ACTIVE', emergencyContact: '', notes: '',
    ...initial,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoPreview, setPhotoPreview] = useState<string>(initial?.profilePhoto ?? '');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [workLocations, setWorkLocations] = useState<WorkLocation[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from('organizations').select('id, name'),
      supabase.from('work_locations').select('id, name'),
    ]).then(([{ data: orgs }, { data: locs }]) => {
      if (orgs) setOrganizations(orgs as Organization[]);
      if (locs) setWorkLocations(locs as WorkLocation[]);
    });
  }, []);

  const set = (k: keyof Member, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName?.trim()) e.fullName = t('common.required');
    if (!form.memberId?.trim()) e.memberId = t('common.required');
    if (!form.phone?.trim()) e.phone = t('common.required');
    if (!form.organizationId) e.organizationId = t('common.required');
    if (!form.jobRole?.trim()) e.jobRole = t('common.required');
    if (!form.workAddress?.trim()) e.workAddress = t('common.required');
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

        <Field label={t('members.organization')} error={errors.organizationId}>
          <SelectWrapper value={form.organizationId ?? ''} onChange={v => set('organizationId', v)} error={errors.organizationId}>
            <option value="">-- {t('members.organization')} --</option>
            {organizations.map((o: Organization) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </SelectWrapper>
        </Field>

        <Input label={t('members.jobRole')} required value={form.jobRole ?? ''} onChange={e => set('jobRole', e.target.value)} error={errors.jobRole} />

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

        <Input label={t('members.emergencyContact')} required placeholder="+251911000000" value={form.emergencyContact ?? ''} onChange={e => set('emergencyContact', e.target.value)} error={errors.emergencyContact} />

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

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Plus, Edit, Trash2, Clock, Radio } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { WorkLocation, Organization } from '../types';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CENTER: [number, number] = [9.0192, 38.7525];

// ── Defined OUTSIDE WorkLocations so React never remounts it on re-render ──
interface LocationFormValues {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  organizationId: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  geofenceRadius: string;
  status: 'ACTIVE' | 'INACTIVE';
}

function LocationForm({
  form,
  setForm,
  organizations,
  t,
}: {
  form: LocationFormValues;
  setForm: React.Dispatch<React.SetStateAction<LocationFormValues>>;
  organizations: Organization[];
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input
            label={t('workLocations.locationName') + ' *'}
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          />
        </div>
        <div className="col-span-2">
          <Input
            label={t('workLocations.address') + ' *'}
            value={form.address}
            onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
          />
        </div>
        <Input
          label={t('workLocations.latitude') + ' *'}
          type="number" step="0.000001"
          value={form.latitude}
          onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))}
          placeholder="9.0192"
        />
        <Input
          label={t('workLocations.longitude') + ' *'}
          type="number" step="0.000001"
          value={form.longitude}
          onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))}
          placeholder="38.7525"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('workLocations.assignedOrg')} *
          </label>
          <select
            value={form.organizationId}
            onChange={e => setForm(p => ({ ...p, organizationId: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">-- Select Organization --</option>
            {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <Input
          label={t('workLocations.geofenceRadius')}
          type="number"
          value={form.geofenceRadius}
          onChange={e => setForm(p => ({ ...p, geofenceRadius: e.target.value }))}
        />
        <Input
          label="Working Hours Start"
          type="time"
          value={form.workingHoursStart}
          onChange={e => setForm(p => ({ ...p, workingHoursStart: e.target.value }))}
        />
        <Input
          label="Working Hours End"
          type="time"
          value={form.workingHoursEnd}
          onChange={e => setForm(p => ({ ...p, workingHoursEnd: e.target.value }))}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('workLocations.locationStatus')}
          </label>
          <select
            value={form.status}
            onChange={e => setForm(p => ({ ...p, status: e.target.value as 'ACTIVE' | 'INACTIVE' }))}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>
    </div>
  );
}
// ───────────────────────────────────────────────────────────────────────────

const EMPTY_FORM: LocationFormValues = {
  name: '', address: '', latitude: '', longitude: '',
  organizationId: '', workingHoursStart: '08:00', workingHoursEnd: '17:00',
  geofenceRadius: '200', status: 'ACTIVE',
};

export default function WorkLocations() {
  const { t } = useTranslation();
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WorkLocation | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WorkLocation | null>(null);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [form, setForm] = useState<LocationFormValues>(EMPTY_FORM);

  const resetForm = () => setForm(EMPTY_FORM);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [{ data: locsData }, { data: orgsData }] = await Promise.all([
        supabase.from('work_locations').select('*'),
        supabase.from('organizations').select('*'),
      ]);
      if (locsData) setLocations(locsData as WorkLocation[]);
      if (orgsData) setOrganizations(orgsData as Organization[]);
      setLoading(false);
    }
    load();
  }, []);

  const handleAdd = async () => {
    if (!form.name || !form.address || !form.latitude || !form.longitude || !form.organizationId) {
      toast.error('Please fill all required fields'); return;
    }
    const { data, error } = await supabase.from('work_locations').insert([{
      name: form.name, address: form.address,
      latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude),
      organization_id: form.organizationId,
      working_hours_start: form.workingHoursStart, working_hours_end: form.workingHoursEnd,
      geofence_radius: parseInt(form.geofenceRadius), status: form.status,
    }]).select().single();
    if (error) { toast.error('Failed to add location'); return; }
    setLocations(p => [...p, data as WorkLocation]);
    setAddOpen(false); resetForm();
    toast.success('Work location added');
  };

  const handleEdit = async () => {
    if (!selected) return;
    const { data, error } = await supabase.from('work_locations').update({
      name: form.name || selected.name,
      address: form.address || selected.address,
      latitude: form.latitude ? parseFloat(form.latitude) : selected.latitude,
      longitude: form.longitude ? parseFloat(form.longitude) : selected.longitude,
      organization_id: form.organizationId || selected.organizationId,
      working_hours_start: form.workingHoursStart,
      working_hours_end: form.workingHoursEnd,
      geofence_radius: parseInt(form.geofenceRadius),
      status: form.status,
    }).eq('id', selected.id).select().single();
    if (error) { toast.error('Failed to update location'); return; }
    setLocations(p => p.map(l => l.id === selected.id ? (data as WorkLocation) : l));
    setEditOpen(false); setSelected(null); resetForm();
    toast.success('Work location updated');
  };

  const openEdit = (loc: WorkLocation) => {
    setSelected(loc);
    setForm({
      name: loc.name, address: loc.address,
      latitude: String(loc.latitude), longitude: String(loc.longitude),
      organizationId: loc.organizationId,
      workingHoursStart: loc.workingHoursStart, workingHoursEnd: loc.workingHoursEnd,
      geofenceRadius: String(loc.geofenceRadius), status: loc.status,
    });
    setEditOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('work_locations').delete().eq('id', deleteTarget.id);
    if (error) { toast.error('Failed to delete location'); return; }
    setLocations(p => p.filter(l => l.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success('Location deleted');
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('workLocations.title')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{locations.length} locations registered</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button onClick={() => setView('list')} className={clsx('px-3 py-2 text-sm', view === 'list' ? 'bg-green-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700')}>List</button>
            <button onClick={() => setView('map')} className={clsx('px-3 py-2 text-sm', view === 'map' ? 'bg-green-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700')}>Map</button>
          </div>
          <Button icon={<Plus size={16} />} onClick={() => { resetForm(); setAddOpen(true); }}>
            {t('workLocations.addLocation')}
          </Button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {locations.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-gray-400">No work locations found.</div>
          ) : locations.map(loc => {
            const org = organizations.find(o => o.id === loc.organizationId);
            return (
              <Card key={loc.id} hover className="group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: org?.color + '20' }}>
                      <MapPin size={18} style={{ color: org?.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{loc.name}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[160px]">{loc.address}</p>
                    </div>
                  </div>
                  <Badge label={loc.status} variant={loc.status === 'ACTIVE' ? 'success' : 'default'} />
                </div>
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={12} /><span>{loc.workingHoursStart} – {loc.workingHoursEnd}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Radio size={12} /><span>Geofence: {loc.geofenceRadius}m</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: org?.color }} />
                    <span style={{ color: org?.color }} className="font-medium">{org?.name}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-xs text-gray-500">{loc.assignedMembers?.length ?? 0} members assigned</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(loc)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-600 transition-colors">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(loc)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="h-[calc(100vh-14rem)] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
          <MapContainer center={CENTER} zoom={13} className="w-full h-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {locations.map(loc => {
              const org = organizations.find(o => o.id === loc.organizationId);
              return (
                <div key={loc.id}>
                  <Marker position={[loc.latitude, loc.longitude]}>
                    <Popup>
                      <div className="p-1 min-w-[180px]">
                        <p className="font-bold text-sm">{loc.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{loc.address}</p>
                        <p className="text-xs mt-1" style={{ color: org?.color }}>{org?.name}</p>
                        <p className="text-xs text-gray-400">Hours: {loc.workingHoursStart} – {loc.workingHoursEnd}</p>
                        <p className="text-xs text-gray-400">Radius: {loc.geofenceRadius}m</p>
                      </div>
                    </Popup>
                  </Marker>
                  <Circle
                    center={[loc.latitude, loc.longitude]}
                    radius={loc.geofenceRadius}
                    pathOptions={{ color: org?.color ?? '#6B7280', fillColor: org?.color ?? '#6B7280', fillOpacity: 0.1, weight: 1.5, dashArray: '5,5' }}
                  />
                </div>
              );
            })}
          </MapContainer>
        </div>
      )}

      {/* Add Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={t('workLocations.addLocation')} size="md"
        footer={<><Button variant="outline" onClick={() => setAddOpen(false)}>{t('common.cancel')}</Button><Button onClick={handleAdd}>{t('common.save')}</Button></>}>
        <LocationForm form={form} setForm={setForm} organizations={organizations} t={t} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Work Location" size="md"
        footer={<><Button variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button><Button onClick={handleEdit}>{t('common.save')}</Button></>}>
        <LocationForm form={form} setForm={setForm} organizations={organizations} t={t} />
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Location" size="sm"
        footer={<><Button variant="outline" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button><Button variant="danger" onClick={handleDelete}>{t('common.delete')}</Button></>}>
        <p className="text-gray-600 dark:text-gray-300">Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.</p>
      </Modal>
    </div>
  );
}

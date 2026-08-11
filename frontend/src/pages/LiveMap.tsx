import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, MapPin, Users, Building2, Phone } from 'lucide-react';
import type { Member, Organization, WorkLocation } from '../types';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import SearchBar from '../components/common/SearchBar';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';

// Fix default marker icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createColoredMarker = (color: string) =>
  L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });

const workLocationIcon = L.divIcon({
  className: '',
  html: `<div style="width:24px;height:24px;background:#374151;border-radius:4px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center"><span style="color:white;font-size:12px">📍</span></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

function MapCenterButton({ center }: { center: [number, number] }) {
  const map = useMap();
  return (
    <button
      onClick={() => map.setView(center, 13)}
      className="absolute bottom-8 right-4 z-[1000] bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50"
      title="Center map"
    >
      <MapPin size={18} />
    </button>
  );
}

const CENTER: [number, number] = [9.0192, 38.7525]; // Addis Ababa

export default function LiveMap() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedOrg, setSelectedOrg] = useState('');
  const [search, setSearch] = useState('');
  const [showGeofences, setShowGeofences] = useState(true);
  const [showWorkLocations, setShowWorkLocations] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [workLocations, setWorkLocations] = useState<WorkLocation[]>([]);

  useEffect(() => {
    async function load() {
      const [{ data: membersData }, { data: orgsData }, { data: locsData }] = await Promise.all([
        supabase.from('members').select('*, organization:organizations(*), lastLocation:gps_locations(*)').eq('is_sharing', true),
        supabase.from('organizations').select('*'),
        supabase.from('work_locations').select('*'),
      ]);
      if (membersData) setMembers(membersData as Member[]);
      if (orgsData) setOrganizations(orgsData as Organization[]);
      if (locsData) setWorkLocations(locsData as WorkLocation[]);
    }
    load();
  }, []);

  const activeMembers = members.filter(m => {
    if (!m.isSharing || !m.lastLocation) return false;
    if (selectedOrg && m.organizationId !== selectedOrg) return false;
    if (search) {
      const q = search.toLowerCase();
      return m.fullName.toLowerCase().includes(q) || m.memberId.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredLocations = workLocations.filter(l =>
    !selectedOrg || l.organizationId === selectedOrg
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <SearchBar value={search} onChange={setSearch} placeholder={t('map.searchMember')} className="w-48" />

        <select
          value={selectedOrg}
          onChange={e => setSelectedOrg(e.target.value)}
          className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">{t('map.allOrgs')}</option>
          {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>

        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input type="checkbox" checked={showGeofences} onChange={e => setShowGeofences(e.target.checked)} className="rounded text-green-600" />
          {t('map.showGeofences')}
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input type="checkbox" checked={showWorkLocations} onChange={e => setShowWorkLocations(e.target.checked)} className="rounded text-green-600" />
          {t('map.workLocations')}
        </label>

        <div className="ml-auto flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-gray-600 dark:text-gray-400">{activeMembers.length} {t('map.activeMembers')}</span>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Map */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm relative">
          <MapContainer center={CENTER} zoom={13} className="w-full h-full" zoomControl={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Work location markers */}
            {showWorkLocations && filteredLocations.map(loc => (
              <div key={loc.id}>
                <Marker position={[loc.latitude, loc.longitude]} icon={workLocationIcon}>
                  <Popup>
                    <div className="p-1 min-w-[180px]">
                      <p className="font-bold text-sm">{loc.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{loc.address}</p>
                      <p className="text-xs text-gray-400 mt-1">Hours: {loc.workingHoursStart} – {loc.workingHoursEnd}</p>
                      <p className="text-xs text-gray-400">Geofence: {loc.geofenceRadius}m</p>
                    </div>
                  </Popup>
                </Marker>
                {showGeofences && (
                  <Circle
                    center={[loc.latitude, loc.longitude]}
                    radius={loc.geofenceRadius}
                    pathOptions={{ color: '#6B7280', fillColor: '#6B7280', fillOpacity: 0.08, weight: 1.5, dashArray: '5,5' }}
                  />
                )}
              </div>
            ))}

            {/* Member markers */}
            {activeMembers.map(member => {
              const loc = member.lastLocation!;
              const org = member.organization;
              const icon = createColoredMarker(org?.color ?? '#22C55E');
              return (
                <Marker
                  key={member.id}
                  position={[loc.latitude, loc.longitude]}
                  icon={icon}
                  eventHandlers={{ click: () => setSelectedMember(member) }}
                >
                  <Popup>
                    <div className="p-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-2">
                        <img src={member.profilePhoto} alt={member.fullName} className="w-10 h-10 rounded-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <div>
                          <p className="font-bold text-sm">{member.fullName}</p>
                          <p className="text-xs text-gray-500">{member.jobRole}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center gap-1"><Building2 size={11} /><span style={{ color: org?.color }}>{org?.name}</span></div>
                        <div className="flex items-center gap-1"><Phone size={11} />{member.phone}</div>
                        <div className="flex items-center gap-1"><MapPin size={11} />{member.workAddress}</div>
                        <div className="flex items-center gap-1"><Navigation size={11} />{loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}</div>
                        {loc.accuracy && <p className="text-gray-400">Accuracy: {loc.accuracy}m</p>}
                      </div>
                      <button
                        onClick={() => navigate(`/members/${member.id}`)}
                        className="mt-2 w-full text-xs bg-green-600 text-white rounded-lg py-1.5 hover:bg-green-700 transition-colors"
                      >
                        View Profile
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            <MapCenterButton center={CENTER} />
          </MapContainer>
        </div>

        {/* Active members sidebar */}
        <div className="w-64 shrink-0 flex flex-col gap-2 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-center gap-2 mb-3">
              <Users size={15} className="text-green-600" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{t('map.activeMembers')}</span>
              <span className="ml-auto text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">{activeMembers.length}</span>
            </div>
            <div className="space-y-2">
              {activeMembers.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">{t('map.noActiveMembers')}</p>
              ) : activeMembers.map(m => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMember(m)}
                  className={clsx(
                    'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors',
                    selectedMember?.id === m.id
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  )}
                >
                  <div className="relative shrink-0">
                    <img src={m.profilePhoto} alt={m.fullName} className="w-8 h-8 rounded-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border border-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{m.fullName}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: m.organization?.color }} />
                      <p className="text-[10px] text-gray-400 truncate">{m.organization?.name}</p>
                    </div>
                  </div>
                  {m.locationStatus && (
                    <Badge
                      label={m.locationStatus === 'AT_WORK' ? '✓' : m.locationStatus === 'NEARBY' ? '~' : '!'}
                      variant={m.locationStatus === 'AT_WORK' ? 'success' : m.locationStatus === 'NEARBY' ? 'warning' : 'danger'}
                      size="sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Organizations</p>
            {organizations.map(o => (
              <div key={o.id} className="flex items-center gap-2 py-1">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: o.color }} />
                <span className="text-xs text-gray-600 dark:text-gray-400">{o.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

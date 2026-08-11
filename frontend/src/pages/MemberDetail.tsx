import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Phone, MapPin, Navigation, Calendar, Edit, Trash2, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Member } from '../types';
import { supabase } from '../lib/supabase';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import MemberForm from '../components/members/MemberForm';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';

// ── Outside component — prevents remount/focus loss on re-render ──
function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <Icon size={15} className="text-gray-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{value}</p>
      </div>
    </div>
  );
}

const locationStatusConfig = {
  AT_WORK: { label: 'At Work Location', variant: 'success' as const },
  NEARBY: { label: 'Nearby', variant: 'warning' as const },
  OUTSIDE: { label: 'Outside Assigned Area', variant: 'danger' as const },
  OFFLINE: { label: 'Location Offline', variant: 'default' as const },
};

const attendanceConfig = {
  PRESENT: { label: 'Present', variant: 'success' as const },
  ABSENT: { label: 'Absent', variant: 'danger' as const },
  LATE: { label: 'Late', variant: 'warning' as const },
  CHECKED_OUT: { label: 'Checked Out', variant: 'info' as const },
  WORKING: { label: 'Working', variant: 'success' as const },
};

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [member, setMember] = useState<Member | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('members')
      .select(`
        *,
        organization:organizations(*),
        group:groups(*),
        woreda:woredas(*),
        subcity:subcities(*),
        workLocation:work_locations(*),
        lastLocation:gps_locations(*),
        todayAttendance:attendances(*)
      `)
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setMember(data as Member);
        setLoading(false);
      });
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

  if (!member) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
      <p className="text-lg">Member not found</p>
      <Button variant="ghost" onClick={() => navigate('/members')} className="mt-3">
        <ArrowLeft size={16} /> Back to Members
      </Button>
    </div>
  );

  const locStatus = member.locationStatus ? locationStatusConfig[member.locationStatus] : null;
  const attStatus = member.todayAttendance?.status ? attendanceConfig[member.todayAttendance.status] : null;

  const handleEdit = async (data: Partial<Member>) => {
    if (!member) return;
    const { data: updated, error } = await supabase
      .from('members')
      .update({
        fullName:         data.fullName,
        gender:           data.gender,
        phone:            data.phone,
        jobRole:          data.jobRole,
        workAddress:      data.workAddress,
        emergencyContact: data.emergencyContact,
        notes:            data.notes,
        status:           data.status,
      })
      .eq('id', member.id)
      .select('*, organization:organizations(*), workLocation:work_locations(*), lastLocation:gps_locations(*), todayAttendance:attendances(*)')
      .single();
    if (error) { toast.error('Failed to update member'); return; }
    setMember(updated as Member);
    setEditOpen(false);
    toast.success('Member updated successfully');
  };

  const handleDelete = async () => {
    if (!member) return;
    const { error } = await supabase.from('members').delete().eq('id', member.id);
    if (error) { toast.error('Failed to delete member'); return; }
    navigate('/members');
    toast.success('Member removed');
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('members.title')}</h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Profile card */}
        <Card className="xl:col-span-1">
          <div className="flex flex-col items-center text-center gap-3 pb-5 border-b border-gray-100 dark:border-gray-700">
            <Avatar src={member.profilePhoto} name={member.fullName} size="2xl" online={member.isSharing} />
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{member.fullName}</h3>
              <p className="text-sm text-gray-500 font-mono mt-0.5">{member.memberId}</p>
            </div>
            {/* Org badge */}
            <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: member.organization?.color + '20', color: member.organization?.color }}>
              {member.organization?.name}
            </span>
            {/* Status badges */}
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge label={member.status} variant={member.status === 'ACTIVE' ? 'success' : member.status === 'INACTIVE' ? 'default' : 'danger'} dot />
              {locStatus && <Badge label={locStatus.label} variant={locStatus.variant} dot />}
              {attStatus && <Badge label={attStatus.label} variant={attStatus.variant} />}
            </div>
          </div>

          {/* GPS status */}
          <div className={`mt-4 p-3 rounded-xl flex items-center gap-3 ${member.isSharing ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
            <Navigation size={18} className={member.isSharing ? 'text-green-600' : 'text-gray-400'} />
            <div>
              <p className={`text-sm font-semibold ${member.isSharing ? 'text-green-700 dark:text-green-400' : 'text-gray-500'}`}>
                {member.isSharing ? t('status.sharingOn') : t('status.sharingOff')}
              </p>
              {member.lastLocation && (
                <p className="text-xs text-gray-400">
                  {t('members.lastUpdated')}: {formatDistanceToNow(new Date(member.lastLocation.timestamp), { addSuffix: true })}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" icon={<Edit size={14} />} onClick={() => setEditOpen(true)} className="flex-1">
              {t('common.edit')}
            </Button>
            <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={() => setDeleteOpen(true)} className="flex-1">
              {t('common.delete')}
            </Button>
          </div>
        </Card>

        {/* Details */}
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Personal Information</h4>
            <InfoRow icon={Phone} label={t('members.phone')} value={member.phone} />
            <InfoRow icon={Calendar} label={t('members.gender')} value={member.gender === 'MALE' ? t('members.male') : t('members.female')} />
            <InfoRow icon={Calendar} label={t('members.registrationDate')} value={format(new Date(member.registrationDate), 'dd MMM yyyy')} />
            <InfoRow icon={Phone} label={t('members.emergencyContact')} value={member.emergencyContact} />
            {member.notes && <InfoRow icon={Calendar} label={t('members.notes')} value={member.notes} />}
          </Card>

          <Card>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Work Information</h4>
            {member.subcity && <InfoRow icon={MapPin} label="ክፍለ ከተማ (Subcity)" value={member.subcity.name} />}
            {member.woreda  && <InfoRow icon={MapPin} label="ወረዳ (Woreda)"        value={member.woreda.name} />}
            {member.group   && <InfoRow icon={MapPin} label="ቡድን (Group)"          value={member.group.name} />}
            <InfoRow icon={MapPin} label={t('members.jobRole')} value={member.jobRole} />
            <InfoRow icon={MapPin} label={t('members.workAddress')} value={member.workAddress} />
            {member.workLocation && <InfoRow icon={MapPin} label={t('members.workLocation')} value={member.workLocation.name} />}
          </Card>

          {/* Location info */}
          {member.lastLocation && (
            <Card>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">{t('members.gpsStatus')}</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Latitude', value: member.lastLocation.latitude.toFixed(6) },
                  { label: 'Longitude', value: member.lastLocation.longitude.toFixed(6) },
                  { label: 'Accuracy', value: `${member.lastLocation.accuracy ?? '–'} m` },
                  { label: 'Device', value: member.lastLocation.deviceStatus },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm font-mono font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-gray-400 flex items-center gap-1">
                <Clock size={12} />
                Last updated: {formatDistanceToNow(new Date(member.lastLocation.timestamp), { addSuffix: true })}
              </div>
            </Card>
          )}

          {/* Attendance history */}
          <Card>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">{t('members.attendanceHistory')}</h4>
            <div className="space-y-2">
              {[member.todayAttendance].filter(Boolean).map((att, i) => att && (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <Badge label={att.status} variant={att.status === 'PRESENT' ? 'success' : att.status === 'ABSENT' ? 'danger' : att.status === 'LATE' ? 'warning' : 'info'} />
                  <span className="text-sm text-gray-600 dark:text-gray-300">{format(new Date(att.date), 'dd MMM yyyy')}</span>
                  {att.checkIn && <span className="text-xs text-gray-400">In: {att.checkIn}</span>}
                  {att.checkOut && <span className="text-xs text-gray-400">Out: {att.checkOut}</span>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={t('members.editMember')} size="lg">
        <MemberForm initial={member} onSubmit={handleEdit} onCancel={() => setEditOpen(false)} />
      </Modal>

      {/* Delete confirm */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title={t('members.deleteMember')} size="sm"
        footer={<>
          <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={handleDelete}>{t('common.delete')}</Button>
        </>}>
        <p className="text-gray-600 dark:text-gray-300">Are you sure you want to delete <strong>{member.fullName}</strong>? This action cannot be undone.</p>
      </Modal>
    </div>
  );
}

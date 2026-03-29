import { CheckCircle, Settings, Save, LockKeyhole, SquarePen } from 'lucide-react';
import AdminLayout from '../layout/AdminLayout';
import Heading from '@/components/Heading';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TextArea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { format } from 'date-fns';
import { useBookingRules, useUpdateBookingRules, useUpdateFloorStatus, useAllFloors, type UpdateFloorStatusData } from '@/services/admin';
import ColorBadge from '@/components/ColorBadge';
import { DateRangePicker } from '@/components/DateRangePicker';
import type { FloorWithLockerCount } from '@/types/floor';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RuleMetadata {
  id: string;
  label: string;
  description: string;
  type: 'number' | 'boolean';
  unit?: string;
  min?: number;
  max?: number;
}

const RULE_METADATA: RuleMetadata[] = [
  {
    id: 'max_duration',
    label: 'Maximum Booking Duration',
    description: 'Maximum number of days a standard booking can span.',
    type: 'number',
    unit: 'days',
    min: 1,
    max: 14
  },
  {
    id: 'max_extension',
    label: 'Maximum Extension',
    description: 'Maximum additional days allowed when extending a booking.',
    type: 'number',
    unit: 'days',
    min: 1,
    max: 7
  },
  {
    id: 'advance_booking_window',
    label: 'Advance Booking Window',
    description: 'How far in advance employees can book a locker.',
    type: 'number',
    unit: 'days',
    min: 1,
    max: 90
  },
  {
    id: 'same_day_bookings',
    label: 'Allow Same-Day Bookings',
    description: 'Permit bookings that start on the current day.',
    type: 'boolean'
  },
];

const BookingRules = () => {
  const [saved, setSaved] = useState(false);
  const [changes, setChanges] = useState<Record<string, number | boolean | ''>>({});
  const [openFloorDialog, setOpenFloorDialog] = useState<boolean>(false);
  const [selectedFloor, setSelectedFloor] = useState<FloorWithLockerCount | null>(null);
  const [floorStatus, setFloorStatus] = useState<'open' | 'closed'>('open');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState<string>('');

  const { data: rulesData } = useBookingRules();
  const { data: floors } = useAllFloors();
  const updateBookingRulesMutation = useUpdateBookingRules();
  const updateFloorStatusMutation = useUpdateFloorStatus();

  const rules = useMemo(() => {
    return RULE_METADATA.map(meta => {
      if (meta.id in changes) {
        return { ...meta, value: changes[meta.id] };
      }

      const backendRule = rulesData?.find(r => r.rule_type === meta.id);
      const value = backendRule
        ? (meta.type === 'boolean' ? Boolean(backendRule.value) : backendRule.value)
        : (meta.type === 'boolean' ? false : 0);

      return { ...meta, value };
    });
  }, [rulesData, changes]);

  const updateRule = (id: string, value: number | boolean | '') => {
    setChanges(prev => ({ ...prev, [id]: value }));
    setSaved(false);
  };

  const save = async () => {
    const updates: Record<string, number | boolean> = {};

    if ('max_duration' in changes) updates.max_booking_duration = (changes.max_duration === '' ? 0 : changes.max_duration) as number;
    if ('max_extension' in changes) updates.max_extension = (changes.max_extension === '' ? 0 : changes.max_extension) as number;
    if ('advance_booking_window' in changes) updates.advance_booking_window = (changes.advance_booking_window === '' ? 0 : changes.advance_booking_window) as number;
    if ('same_day_bookings' in changes) updates.allow_same_day_bookings = changes.same_day_bookings as boolean;

    try {
      await updateBookingRulesMutation.mutateAsync(updates);
      setChanges({});
      setSaved(true);
      toast.success('Updated booking rules successfully');
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error('Failed to update booking rules');
    }
  };

  const hasChanges = useMemo(() => {
    return Object.keys(changes).some(ruleId => {
      const backendRule = rulesData?.find(r => r.rule_type === ruleId);
      const changedValue = changes[ruleId];

      if (!backendRule) return changedValue !== 0 && changedValue !== false;

      const meta = RULE_METADATA.find(m => m.id === ruleId);
      if (!meta) return false;

      const backendValue = meta.type === 'boolean'
        ? Boolean(backendRule.value)
        : backendRule.value;

      return changedValue !== backendValue;
    });
  }, [changes, rulesData]);

  const handleEdit = (floor: FloorWithLockerCount) => {
    setSelectedFloor(floor);
    setFloorStatus(floor.status as 'open' | 'closed');
    setStartDate(undefined);
    setEndDate(undefined);
    setReason('');
    setOpenFloorDialog(true);
  };

  const hasFloorStatusChanges = useMemo(() => {
    if (!selectedFloor) return false;

    if (floorStatus !== selectedFloor.status) return true;

    if (floorStatus === 'closed' && (startDate || endDate || reason)) return true;

    return false;
  }, [floorStatus, selectedFloor, startDate, endDate, reason]);

  const handleUpdateFloorStatus = async () => {
    if (!selectedFloor) return;

    try {
      const data: UpdateFloorStatusData = {
        status: floorStatus,
      };

      if (floorStatus === 'closed' && startDate) {
        data.start_date = format(startDate, 'yyyy-MM-dd');
        if (endDate) {
          data.end_date = format(endDate, 'yyyy-MM-dd');
        }
        if (reason) data.reason = reason;
      }

      await updateFloorStatusMutation.mutateAsync({
        floorId: selectedFloor.floor_id,
        data
      });

      toast.success(`Floor ${selectedFloor.floor_number} status updated successfully`);
      setOpenFloorDialog(false);
    } catch {
      toast.error('Failed to update floor status');
    }
  };

  return (
    <AdminLayout>
      <main className="w-full space-y-6">
        <div className="flex items-start justify-between">
          <Heading
            title="Booking Rules"
            description="Set system-wide constraints that apply to all locker bookings."
          />
          <Button
            variant='highlight'
            onClick={save}
            className="gap-2"
            disabled={!hasChanges || updateBookingRulesMutation.isPending}
          >
            {saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {updateBookingRulesMutation.isPending
              ? 'Saving...'
              : saved
                ? 'Saved'
                : 'Save Changes'
            }
          </Button>
        </div>
        <div className="bg-white border border-grey-outline rounded-lg shadow-sm p-7">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center">
              <Settings className="mr-2 h-5 w-5 text-primary" />
              <h3 className="font-medium">Booking Constraints</h3>
            </div>
            {hasChanges && (
              <span className="text-sm text-amber-600 font-medium">
                • Unsaved changes
              </span>
            )}
          </div>

          <div className="space-y-4">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between gap-4 py-3 border-b border-grey-outline last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark-blue">{rule.label}</p>
                  <p className="text-xs text-grey mt-0.5">{rule.description}</p>
                </div>
                <div className="shrink-0">
                  {rule.type === 'boolean' ? (
                    <Switch
                      checked={rule.value as boolean}
                      onCheckedChange={(v) => updateRule(rule.id, v)}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={rule.value === '' ? '' : rule.value as number}
                        min={rule.min}
                        max={rule.max}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Number(e.target.value);
                          updateRule(rule.id, val);
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '') {
                            updateRule(rule.id, 0);
                          }
                        }}
                        className="h-8 w-20 text-sm text-right"
                      />
                      {rule.unit && (
                        <span className="text-xs text-grey w-10">{rule.unit}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-grey-outline rounded-lg shadow-sm p-7 mt-8">
          <div className="flex items-center gap-2 mb-4">
            <LockKeyhole className="mr-2 h-5 w-5 text-primary" />
            <h3 className="font-medium">Floor Booking Access</h3>
          </div>
          <div>
            {floors?.map((floor) => (
              <div key={floor.floor_id} className="flex flex-col py-2">
                <div className="bg-background p-4 w-full rounded-lg border border-grey-outline">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <p className="text-sm font-medium text-dark-blue">Floor {floor.floor_number}</p>
                      <div className="bg-white rounded-full text-xs text-grey border border-grey-outline px-2 py-1">
                        {floor.total_lockers} Lockers
                      </div>
                      <ColorBadge status={floor.status} color={floor.status === 'open' ? 'green' : 'red'} />
                    </div>

                    <Button
                      variant='icon'
                      className="h-auto w-auto pr-1"
                      onClick={() => handleEdit(floor)}
                    >
                      <SquarePen className="!h-5 !w-5" />
                    </Button>
                  </div>

                  {floor.closures && floor.closures.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-grey-outline">
                      <p className="text-xs font-medium text-grey mb-2">Upcoming Closures:</p>
                      <div className="space-y-1">
                        {floor.closures.map((closure) => (
                          <div key={closure.closure_id} className="text-xs text-grey">
                            <span>
                              {closure.end_date
                                ? `${format(new Date(closure.start_date), 'dd MMM yyyy')} - ${format(new Date(closure.end_date), 'dd MMM yyyy')}`
                                : `Indefinite closure starting ${format(new Date(closure.start_date), 'dd MMM yyyy')}`
                              }
                            </span>
                            {closure.reason && <span className="ml-2 font-light">• {closure.reason}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Dialog open={openFloorDialog} onOpenChange={setOpenFloorDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Floor {selectedFloor?.floor_number} Access</DialogTitle>
            <DialogDescription>
              Close or open this floor for new bookings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Floor Status</Label>
                <p className="text-xs text-grey">Allow or prevent new bookings on this floor</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${floorStatus === 'closed' ? 'text-grey' : 'font-medium text-green'}`}>
                  Open
                </span>
                <Switch
                  checked={floorStatus === 'closed'}
                  onCheckedChange={(checked) => setFloorStatus(checked ? 'closed' : 'open')}
                />
                <span className={`text-sm ${floorStatus === 'closed' ? 'font-medium text-red' : 'text-grey'}`}>
                  Closed
                </span>
              </div>
            </div>

            {floorStatus === 'closed' && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Closure Period <span className="font-normal text-grey">(optional)</span></Label>
                  <p className="text-xs text-grey mb-2">
                    Set a start date to schedule the closure (floor stays open until then). Leave dates empty to close immediately.
                  </p>
                  <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                    disableWeekends={false}
                    disableRules={true}
                    labelClassName="text-xs font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason" className="text-sm font-medium">Reason <span className="font-normal text-grey">(optional)</span></Label>
                  <TextArea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="resize-none min-h-0"
                    rows={1}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => setOpenFloorDialog(false)}
              disabled={updateFloorStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="highlight"
              onClick={handleUpdateFloorStatus}
              disabled={!hasFloorStatusChanges || updateFloorStatusMutation.isPending}
            >
              {updateFloorStatusMutation.isPending ? 'Updating...' : 'Update Floor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AdminLayout>
  );
};

export default BookingRules;

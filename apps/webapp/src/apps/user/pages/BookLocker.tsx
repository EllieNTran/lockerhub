import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import UserLayout from '../layout/UserLayout';
import { format } from 'date-fns';
import { Building2, CheckCircle2, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/DateRangePicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import SearchResults from '@/apps/user/components/SearchResults';
import type { Locker, AvailableLocker } from '@/types/locker';
import { toast } from '@/components/ui/sonner';
import Heading from '@/components/Heading';
import { useAvailableLockers, useFloors, useCreateBooking, useJoinFloorQueue } from '@/services/bookings';

const BookLocker = () => {
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');
  const [selectedLocker, setSelectedLocker] = useState<AvailableLocker | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);

  const { data: floors = [], isLoading: floorsLoading } = useFloors();
  const { mutate: createBookingMutation, isPending: isCreatingBooking } = useCreateBooking();
  const { mutate: joinFloorQueueMutation, isPending: isJoiningQueue } = useJoinFloorQueue();

  useEffect(() => {
    if (floors.length > 0 && !selectedFloorId) {
      setSelectedFloorId(floors[0].floor_id);
    }
  }, [floors, selectedFloorId]);

  const { data: availableLockers = [], isLoading } = useAvailableLockers({
    floor_id: selectedFloorId,
    start_date: startDate ? format(startDate, 'yyyy-MM-dd') : '',
    end_date: endDate ? format(endDate, 'yyyy-MM-dd') : '',
  });

  useEffect(() => {
    setSelectedLocker(null);
  }, [selectedFloorId, startDate, endDate]);

  const selectedFloor = floors.find(f => f.floor_id === selectedFloorId);
  const floorLockers = startDate && endDate ? availableLockers : [];
  const availableCount = floorLockers.filter(l => l.is_available).length;

  const lockersWithSelection = floorLockers.map(locker => ({
    ...locker,
    selected: locker.locker_id === selectedLocker?.locker_id,
  }));

  const isReadyToBook = startDate && endDate && selectedLocker?.is_available;

  const handleSelectLocker = (locker: Locker | AvailableLocker) => {
    if ('is_available' in locker && locker.is_available) {
      setSelectedLocker(locker as AvailableLocker);
    }
  };

  const handleBook = () => {
    if (!isReadyToBook) {
      toast.error('Please select dates and an available locker');
      return;
    }
    setConfirmOpen(true);
  };

  const confirmBooking = () => {
    if (!selectedLocker || !startDate || !endDate) return;

    createBookingMutation(
      {
        locker_id: selectedLocker.locker_id,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      },
      {
        onSuccess: () => {
          toast.success(`Locker ${selectedLocker.locker_number} booked successfully!`, {
            description: 'Check your email inbox for confirmation.'
          });
          setConfirmOpen(false);
          navigate('/user');
        },
        onError: (error: Error) => {
          if (error.message.includes('Existing overlapping booking exists')) {
            toast.error('You already have a booking for these dates', {
              description: 'Please cancel or modify your existing booking first, or choose different dates.',
              duration: 5000,
            });
          } else if (error.message.includes('Booking conflict')) {
            toast.error('This locker is already booked', {
              description: 'Please select a different locker or choose different dates.',
              duration: 4000,
            });
          } else {
            toast.error(error.message || 'Failed to book locker', {
              description: 'Please try again later.'
            });
          }
        },
      }
    );
  };

  const joinWaitlist = () => {
    if (!selectedFloorId || !startDate || !endDate) return;

    joinFloorQueueMutation(
      {
        floor_id: selectedFloorId,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      },
      {
        onSuccess: () => {
          setIsOnWaitlist(true);
          setWaitlistOpen(false);
          toast.success('Joined Waiting List', {
            description: 'You will be notified when a locker becomes available.'
          })
        },
        onError: (error: Error) => {
          toast.error(error.message || 'Failed to join waiting list');
        },
      }
    );
  };

  return (
    <UserLayout>
      <div className="w-full">
      <main className="container max-w-6xl px-6 py-8 mx-auto">
        <div className="mb-8">
          <Heading
            title="Book a Locker"
            description="Select your dates, choose a floor, then pick an available locker from the results below."
          />

          <div className="mt-5 flex flex-wrap items-end gap-4">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              labelClassName="text-xs font-medium text-grey"
            />

            <div className="space-y-1">
              <label className="block text-xs font-medium text-grey">Floor</label>
              <Select value={selectedFloorId} onValueChange={setSelectedFloorId} disabled={floorsLoading}>
                <SelectTrigger className="w-[180px]">
                  <Building2 className="mr-2 h-4 w-4 text-grey" />
                  <SelectValue placeholder={floorsLoading ? 'Loading...' : 'Select floor'} />
                </SelectTrigger>
                <SelectContent>
                  {floors.map((floor) => (
                    <SelectItem key={floor.floor_id} value={floor.floor_id}>
                      Floor {floor.floor_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="highlight"
              onClick={handleBook}
              disabled={!isReadyToBook}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Book Locker
            </Button>
          </div>
        </div>

        <div className="mb-3 flex items-center gap-6 text-sm">
          <span className="text-grey">
            <span className="font-semibold text-dark-blue">Floor {selectedFloor?.floor_number}</span>
            {startDate && endDate && (
              <>
                {' · '}
                <span className="text-green font-medium">{availableCount} available</span>
                {' · '}
                <span className="text-grey">{floorLockers.length} total</span>
              </>
            )}
          </span>
          {selectedLocker && (
            <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
              Selected: Locker {selectedLocker.locker_number}
            </span>
          )}
        </div>

        {!startDate || !endDate ? (
          <div className="rounded-xl border border-grey-outline bg-card p-12 shadow-card text-center">
            <p className="text-grey">Please select start and end dates to view available lockers</p>
          </div>
        ) : isLoading ? (
          <div className="rounded-xl border border-grey-outline bg-card p-12 shadow-card text-center">
            <p className="text-grey">Loading available lockers...</p>
          </div>
        ) : availableCount === 0 ? (
          <>
            <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Users className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-blue">No lockers available</p>
                  <p className="text-xs text-grey">
                    All lockers on Floor {selectedFloor?.floor_number} are occupied for the selected dates.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={isOnWaitlist}
                onClick={() => setWaitlistOpen(true)}
                className="shrink-0"
              >
                <Clock className="mr-1.5 h-3.5 w-3.5" />
                {isOnWaitlist ? 'On Waiting List' : 'Join Waiting List'}
              </Button>
            </div>
            <TooltipProvider>
              <SearchResults 
                lockers={lockersWithSelection} 
                onSelectLocker={handleSelectLocker}
                floorNumber={selectedFloor?.floor_number || ''}
              />
            </TooltipProvider>
          </>
        ) : (
          <TooltipProvider>
            <SearchResults 
              lockers={lockersWithSelection} 
              onSelectLocker={handleSelectLocker}
              floorNumber={selectedFloor?.floor_number || ''}
            />
          </TooltipProvider>
        )}
      </main>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
            <DialogDescription>You're about to book the following locker:</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-lg bg-muted p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-grey">Locker</span>
              <span className="font-medium">
                {selectedLocker?.locker_number}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-grey">Floor</span>
              <span className="font-medium">Floor {selectedFloor?.floor_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-grey">Period</span>
              <span className="font-medium">
                {startDate && format(startDate, 'MMM d')} — {endDate && format(endDate, 'MMM d, yyyy')}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => setConfirmOpen(false)} disabled={isCreatingBooking}>
              Cancel
            </Button>
            <Button 
              onClick={confirmBooking} 
              disabled={isCreatingBooking}
            >
              {isCreatingBooking ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={waitlistOpen} onOpenChange={setWaitlistOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Waiting List</DialogTitle>
            <DialogDescription>
              You'll be notified when a locker becomes available on{' '}
              <strong>Floor {selectedFloor?.floor_number}</strong> for your selected dates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-lg bg-muted p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-grey">Floor</span>
              <span className="font-medium">Floor {selectedFloor?.floor_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-grey">Period</span>
              <span className="font-medium">
                {startDate && format(startDate, 'MMM d')} — {endDate && format(endDate, 'MMM d, yyyy')}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => setWaitlistOpen(false)} disabled={isJoiningQueue}>
              Cancel
            </Button>
            <Button onClick={joinWaitlist} disabled={isJoiningQueue}>
              <Clock className="mr-2 h-4 w-4" />
              {isJoiningQueue ? 'Joining...' : 'Join Waiting List'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </UserLayout>
  );
};

export default BookLocker;

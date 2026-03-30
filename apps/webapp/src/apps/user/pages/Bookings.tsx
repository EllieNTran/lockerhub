import { useState } from 'react';
import UserLayout from '../layout/UserLayout';
import Heading from '@/components/Heading';
import BookingCard from '../components/BookingCard';
import PaginationControls from '@/components/PaginationControls';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUserBookings, useExtendBooking, useCancelBooking, useBookingRule } from '@/services/bookings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addDays } from 'date-fns';
import { toast } from '@/components/ui/sonner';
import type { Booking } from '@/types/booking';
import PageTour from '@/components/tutorial/PageTour';
import { MY_BOOKINGS_STEPS } from '@/components/tutorial/steps';

const BOOKINGS_PER_PAGE = 10;

const MyBookings = () => {
  const [extendOpen, setExtendOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [newEndDate, setNewEndDate] = useState<Date>();
  const [currentPage, setCurrentPage] = useState<Record<string, number>>({
    active: 1,
    upcoming: 1,
    expired: 1,
    all: 1,
  });

  const { data: bookingsData, isLoading: isLoadingBookings } = useUserBookings();
  const extendBooking = useExtendBooking();
  const cancelBooking = useCancelBooking();
  const { data: extensionRule } = useBookingRule('max_extension');

  const getExtensionOptions = (currentEndDate: string) => {
    const options: Date[] = [];
    let currentDate = new Date(currentEndDate);

    while (options.length < (extensionRule?.value || 1)) {
      currentDate = addDays(currentDate, 1);
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        options.push(new Date(currentDate));
      }
    }

    return options;
  };

  const handleExtend = async (bookingId: string) => {
    const booking = bookingsData?.find(b => b.booking_id === bookingId);
    if (booking) {
      setSelectedBooking(booking);
      setNewEndDate(undefined);
      setExtendOpen(true);
    }
  };

  const confirmExtend = async () => {
    if (!selectedBooking || !newEndDate) return;

    try {
      await extendBooking.mutateAsync({
        bookingId: selectedBooking.booking_id,
        data: { new_end_date: format(newEndDate, 'yyyy-MM-dd') },
      });
      toast.success('Booking Extended', {
        description: 'Check your email inbox for confirmation.'
      });
      setExtendOpen(false);
      setSelectedBooking(null);
      setNewEndDate(undefined);
    } catch {
      toast.error('Failed to extend booking');
    }
  };

  const handleCancel = async (bookingId: string) => {
    const booking = bookingsData?.find(b => b.booking_id === bookingId);
    if (booking) {
      setSelectedBooking(booking);
      setCancelOpen(true);
    }
  };

  const confirmCancel = async () => {
    if (!selectedBooking) return;

    try {
      await cancelBooking.mutateAsync(selectedBooking.booking_id);
      toast.success('Booking Cancelled', {
        description: 'Check your email inbox for confirmation.'
      });
      setCancelOpen(false);
      setSelectedBooking(null);
    } catch {
      toast.error('Failed to cancel booking', {
        description: 'Please try again later.'
      });
    }
  };

  const filterBookings = (status: string) => {
    if (!bookingsData) return [];
    if (status === 'all') return bookingsData;
    if (status === 'expired') {
      return bookingsData.filter(b => b.booking_status === 'completed' || b.booking_status === 'cancelled' || b.booking_status === 'expired');
    }
    return bookingsData.filter(b => b.booking_status === status);
  };

  const getPaginatedBookings = (status: string) => {
    const filteredBookings = filterBookings(status);
    const page = currentPage[status] || 1;
    const startIndex = (page - 1) * BOOKINGS_PER_PAGE;
    const endIndex = startIndex + BOOKINGS_PER_PAGE;
    return filteredBookings.slice(startIndex, endIndex);
  };

  const getTotalPages = (status: string) => {
    const filteredBookings = filterBookings(status);
    return Math.ceil(filteredBookings.length / BOOKINGS_PER_PAGE);
  };

  const handlePageChange = (status: string, page: number) => {
    setCurrentPage(prev => ({ ...prev, [status]: page }));
  };

  const tabs = [
    { value: 'active', label: 'Active' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'expired', label: 'Past' },
    { value: 'all', label: 'All' },
  ];

  return (
    <UserLayout>
      <div className="w-full">
      <main className="container max-w-6xl px-6 py-8 mx-auto">
        <div className="mb-8">
          <Heading
            title="My Bookings"
            description="View, extend, or cancel your locker bookings."
          />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6" data-tour="bookings-tabs">
            {tabs.map((tab) => {
              const count = filterBookings(tab.value).length;
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
                  {tab.label}
                  {count > 0 && (
                    <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="min-h-[500px]">
              {isLoadingBookings ? (
                <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
                  <p className="text-sm text-grey">Loading bookings...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 min-h-[400px]">
                    {getPaginatedBookings(tab.value).length > 0 ? (
                      getPaginatedBookings(tab.value).map((booking, index) => (
                        <div key={booking.booking_id} data-tour={index === 0 ? 'booking-card' : undefined}>
                          <BookingCard
                            booking={booking}
                            variant="large"
                            onExtend={() => handleExtend(booking.booking_id)}
                            onCancel={() => handleCancel(booking.booking_id)}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-grey/40">
                        <CalendarDays className="h-15 w-15 mb-4" />
                        <p className="text-md">No {tab.label.toLowerCase()} bookings found</p>
                      </div>
                    )}
                  </div>

                  <PaginationControls
                    currentPage={currentPage[tab.value] || 1}
                    totalPages={getTotalPages(tab.value)}
                    onPageChange={(page) => handlePageChange(tab.value, page)}
                  />
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Booking</DialogTitle>
            <DialogDescription>
              Select a new end date to extend your booking for {selectedBooking?.locker_number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-3 rounded-lg bg-muted p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-grey">Locker</span>
                <span className="font-medium">{selectedBooking?.locker_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-grey">Floor</span>
                <span className="font-medium">Floor {selectedBooking?.floor_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-grey">Current End Date</span>
                <span className="font-medium">
                  {selectedBooking?.end_date
                    ? format(new Date(selectedBooking.end_date), 'MMM d, yyyy')
                    : 'Permanent'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Select New End Date</label>
              <div className="grid gap-3">
                {selectedBooking?.end_date && getExtensionOptions(selectedBooking.end_date).map((date, index) => (
                  <button
                    key={date.toISOString()}
                    onClick={() => setNewEndDate(date)}
                    className={`flex items-center justify-between rounded-lg border p-4 text-left transition-all hover:border-primary-outline/40 hover:bg-primary-foreground/40 ${
                      newEndDate?.toDateString() === date.toDateString()
                        ? 'border-primary bg-primary-foreground'
                        : 'border-grey-outline bg-white'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-medium">{format(date, 'EEEE, MMMM d, yyyy')}</div>
                      <div className="text-xs text-grey">+{index + 1} day{index > 0 ? 's' : ''} extension</div>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      newEndDate?.toDateString() === date.toDateString()
                        ? 'border-primary'
                        : 'border-grey-outline'
                    }`}>
                      {newEndDate?.toDateString() === date.toDateString() && (
                        <div className="h-3 w-3 rounded-full bg-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="destructive" onClick={() => setExtendOpen(false)} disabled={extendBooking.isPending}>
              Cancel
            </Button>
            <Button
              onClick={confirmExtend}
              disabled={!newEndDate || extendBooking.isPending}
              className="bg-primary text-white hover:bg-primary/90"
            >
              {extendBooking.isPending ? 'Extending...' : 'Confirm Extension'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 rounded-lg bg-muted p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-grey">Locker</span>
              <span className="font-medium">{selectedBooking?.locker_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-grey">Floor</span>
              <span className="font-medium">Floor {selectedBooking?.floor_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-grey">Period</span>
              <span className="font-medium">
                {selectedBooking?.start_date && format(new Date(selectedBooking.start_date), 'MMM d')} —{' '}
                {selectedBooking?.end_date
                  ? format(new Date(selectedBooking.end_date), 'MMM d, yyyy')
                  : 'Permanent'}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setCancelOpen(false)} disabled={cancelBooking.isPending}>
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancel}
              disabled={cancelBooking.isPending}
            >
              {cancelBooking.isPending ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>
      <PageTour steps={MY_BOOKINGS_STEPS} pageName="My Bookings" />
    </UserLayout>
  );
};

export default MyBookings;

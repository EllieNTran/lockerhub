import { useEffect, useState } from 'react';
import { CalendarDays, KeyRound, Undo2 } from 'lucide-react'
import { Link, useSearchParams } from 'react-router';
import AdminLayout from '../layout/AdminLayout';
import Heading from '@/components/Heading';
import StatCard from '../components/StatCard';
import ManageBookingDialog from '../components/ManageBookingDialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { TooltipProvider } from '@/components/ui/tooltip';
import ColorBadge from '@/components/ColorBadge';
import KeyStatus from '../components/KeyStatus';
import type { KeyStatus as KeyStatusType } from '@/types/key';
import PaginationControls from '@/components/PaginationControls';
import { useAllBookings } from '@/services/admin';
import { formatDateRange } from '@/utils/date-format';
import type { AdminBookingDetail } from '@/types/booking';
import StaffTooltip from '../components/StaffTooltip';
import Filters from '../components/Filters';
import { Button } from '@/components/ui/button';
import PageTour from '@/components/tutorial/PageTour';
import { ADMIN_BOOKINGS_STEPS } from '@/components/tutorial/steps';

const ITEMS_PER_PAGE = 12;

const statusColors = {
  upcoming: 'brightBlue',
  active: 'green',
  completed: 'blue',
  cancelled: 'grey',
  expired: 'red',
} as const;

const BOOKING_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' },
];

const KEY_STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'awaiting_handover', label: 'Awaiting Handover' },
  { value: 'with_employee', label: 'With Employee' },
  { value: 'awaiting_return', label: 'Awaiting Return' },
];

const Bookings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [selectedBooking, setSelectedBooking] = useState<AdminBookingDetail | null>(null)
  const [manageDialogOpen, setManageDialogOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [floorFilter, setFloorFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [keyStatusFilter, setKeyStatusFilter] = useState<string>('all')

  const { data: bookingsData = [], isLoading: bookingsLoading } = useAllBookings()

  useEffect(() => {
    const bookingParam = searchParams.get('booking');
    const statusParam = searchParams.get('status');
    if (bookingParam) {
      setSearchQuery(bookingParam);
    }
    if (statusParam) {
      setStatusFilter(statusParam);
    }
    if (bookingParam || statusParam) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const activeBookings = bookingsData?.filter((b) => b.booking_status === 'active').length || 0
  const pendingHandovers = bookingsData?.filter((b) => b.key_status === 'awaiting_handover').length || 0
  const pendingReturns = bookingsData?.filter((b) => b.key_status === 'awaiting_return').length || 0

  const handleSelectBooking = (booking: AdminBookingDetail) => {
    setSelectedBooking(booking);
    setManageDialogOpen(true);
  };

  const filteredBookings = bookingsData?.filter((booking) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      booking.employee_name?.toLowerCase().includes(query) ||
      booking.staff_number?.toLowerCase().includes(query) ||
      booking.locker_number?.toLowerCase().includes(query) ||
      booking.key_number?.toLowerCase().includes(query);

    const matchesFloor = floorFilter === 'all' || booking.floor_id === floorFilter;
    const matchesStatus = statusFilter === 'all' || booking.booking_status === statusFilter;
    const matchesKeyStatus = keyStatusFilter === 'all' || booking.key_status === keyStatusFilter;

    return matchesSearch && matchesFloor && matchesStatus && matchesKeyStatus;
  }) || [];

  const filteredTotalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const filteredStartIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const filteredEndIndex = filteredStartIndex + ITEMS_PER_PAGE;
  const paginatedFilteredBookings = filteredBookings.slice(filteredStartIndex, filteredEndIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, floorFilter, statusFilter, keyStatusFilter])

  return (
    <AdminLayout>
      <main className="w-full space-y-6">
        <Heading
          title="Bookings"
          description="Track all bookings, confirm key handovers, and record key returns."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-tour="admin-bookings-stats">
          <StatCard label="Active Bookings" value={activeBookings} icon={CalendarDays} color="green" />
          <StatCard label="Pending Key Handover" value={pendingHandovers} icon={KeyRound} color="orange" />
          <StatCard label="Pending Key Return" value={pendingReturns} icon={Undo2} color="brightBlue" />
        </div>

        <div data-tour="admin-bookings-filters">
          <Filters
            statusOptions={BOOKING_STATUS_OPTIONS}
            keyStatusOptions={KEY_STATUS_OPTIONS}
            placeholder="Search by employee, locker, key or staff number..."
            searchQuery={searchQuery}
            floorFilter={floorFilter}
            statusFilter={statusFilter}
            keyStatusFilter={keyStatusFilter}
            statusAllOptionLabel="All Booking Statuses"
            onSearchChange={setSearchQuery}
            onFloorChange={setFloorFilter}
            onStatusChange={setStatusFilter}
            onKeyStatusChange={setKeyStatusFilter}
          />
        </div>

        <div className="rounded-xl border border-grey-outline bg-white shadow-sm" data-tour="admin-bookings-table">
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-8">Employee</TableHead>
                  <TableHead>Locker</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Booking Status</TableHead>
                  <TableHead>Key Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookingsLoading ? (
                  <TableRow className="h-16">
                    <TableCell colSpan={7} className="text-center text-grey">
                      Loading bookings...
                    </TableCell>
                  </TableRow>
                ) : paginatedFilteredBookings.length > 0 ? (
                  paginatedFilteredBookings.map((booking, index) => (
                    <TableRow
                      key={booking.booking_id}
                      onClick={() => handleSelectBooking(booking)}
                      className="cursor-pointer h-16"
                      data-tour={index === 0 ? 'admin-booking-row' : undefined}
                    >
                      <TableCell className="font-medium text-dark-blue pl-8">
                        <div data-tour="admin-booking-staff-tooltip">
                          <StaffTooltip booking={booking} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="link"
                          size="sm"
                          asChild
                          onClick={(e) => e.stopPropagation()}
                          className="h-auto p-0 text-grey"
                          data-tour="admin-booking-locker-link"
                        >
                          <Link to={`/admin/lockers?locker=${booking.locker_number}`}>
                            {booking.locker_number}
                          </Link>
                        </Button>
                      </TableCell>
                      <TableCell className="text-grey">{booking.key_number || 'N/A'}</TableCell>
                      <TableCell>Floor {booking.floor_number}</TableCell>
                      <TableCell>{formatDateRange(booking.start_date, booking.end_date)}</TableCell>
                      <TableCell>
                        <ColorBadge
                          status={booking.booking_status}
                          color={statusColors[booking.booking_status as keyof typeof statusColors] ?? 'green'}
                        />
                      </TableCell>
                      <TableCell>
                        {booking.key_status ? (
                          <KeyStatus status={booking.key_status as KeyStatusType} />
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="h-16">
                    <TableCell colSpan={7} className="text-center text-grey">
                      {searchQuery ? 'No bookings found matching your search' : 'No bookings found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TooltipProvider>
        </div>
        <PaginationControls
          currentPage={currentPage}
          totalPages={filteredTotalPages}
          onPageChange={setCurrentPage}
          className="mt-4 mb-4"
        />
      </main>
      {selectedBooking && (
        <ManageBookingDialog
          booking={selectedBooking}
          isOpen={manageDialogOpen}
          onOpenChange={setManageDialogOpen}
          statusColor={statusColors[selectedBooking.booking_status as keyof typeof statusColors] ?? 'green'}
        />
      )}
      <PageTour steps={ADMIN_BOOKINGS_STEPS} pageName="Admin Bookings" />
    </AdminLayout>
  );
};

export default Bookings;

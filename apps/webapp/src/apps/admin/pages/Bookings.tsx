import { useEffect, useState } from 'react';
import { CalendarDays, KeyRound, Undo2 } from 'lucide-react'
import AdminLayout from '../layout/AdminLayout';
import Heading from '@/components/Heading';
import StatCard from '../components/StatCard';
import ManageBookingDialog from '../components/ManageBookingDialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { TooltipProvider } from '@/components/ui/tooltip';
import StatusBadge from '@/components/StatusBadge';
import KeyStatus from '../components/KeyStatus';
import type { KeyStatus as KeyStatusType } from '@/types/key';
import PaginationControls from '@/components/PaginationControls';
import { useAllBookings } from '@/services/admin';
import { formatDateRange } from '@/utils/date-format';
import type { AdminBookingDetail } from '@/types/booking';
import StaffTooltip from '../components/StaffTooltip';
import Filters from '../components/Filters';

const ITEMS_PER_PAGE = 12;

const statusColors = {
  upcoming: 'brightBlue',
  active: 'green',
  completed: 'blue',
  cancelled: 'grey',
  expired: 'red',
} as const;

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' },
];

const Bookings = () => {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [selectedBooking, setSelectedBooking] = useState<AdminBookingDetail | null>(null)
  const [manageDialogOpen, setManageDialogOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [floorFilter, setFloorFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: bookingsData = [], isLoading: bookingsLoading } = useAllBookings()

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
      booking.locker_number?.toLowerCase().includes(query);
    
    const matchesFloor = floorFilter === 'all' || booking.floor_number === floorFilter;
    const matchesStatus = statusFilter === 'all' || booking.booking_status === statusFilter;
    
    return matchesSearch && matchesFloor && matchesStatus;
  }) || [];

  const filteredTotalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const filteredStartIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const filteredEndIndex = filteredStartIndex + ITEMS_PER_PAGE;
  const paginatedFilteredBookings = filteredBookings.slice(filteredStartIndex, filteredEndIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, floorFilter, statusFilter])

  return (
    <AdminLayout>
      <main className="w-full space-y-6">
        <Heading
          title="Bookings"
          description="Track all bookings, confirm key handovers, and record key returns."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Active Bookings" value={activeBookings} icon={CalendarDays} color="green" />
          <StatCard label="Pending Key Handover" value={pendingHandovers} icon={KeyRound} color="orange" />
          <StatCard label="Pending Key Return" value={pendingReturns} icon={Undo2} color="brightBlue" />
        </div>

        <Filters
          statusOptions={statusOptions}
          placeholder="Search by employee, locker number or staff number..."
          searchQuery={searchQuery}
          floorFilter={floorFilter}
          statusFilter={statusFilter}
          onSearchChange={setSearchQuery}
          onFloorChange={setFloorFilter}
          onStatusChange={setStatusFilter}
        />

        <div className="rounded-xl border border-grey-outline bg-white shadow-sm">
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-8">Employee</TableHead>
                  <TableHead>Locker</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Key Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookingsLoading ? (
                  <TableRow className="h-16">
                    <TableCell colSpan={6} className="text-center text-grey">
                      Loading bookings...
                    </TableCell>
                  </TableRow>
                ) : paginatedFilteredBookings.length > 0 ? (
                  paginatedFilteredBookings.map((booking) => (
                    <TableRow 
                      key={booking.booking_id}
                      onClick={() => handleSelectBooking(booking)}
                      className="cursor-pointer h-16"
                    >
                      <TableCell className="font-medium text-dark-blue pl-8">
                        <StaffTooltip booking={booking} />
                      </TableCell>
                      <TableCell>{booking.locker_number}</TableCell>
                      <TableCell>Floor {booking.floor_number}</TableCell>
                      <TableCell>{formatDateRange(booking.start_date, booking.end_date)}</TableCell>
                      <TableCell>
                        <StatusBadge 
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
                    <TableCell colSpan={6} className="text-center text-grey">
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
    </AdminLayout>
  );
};

export default Bookings;

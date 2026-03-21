import { useEffect, useState } from "react";
import { CalendarDays, KeyRound, Undo2, ChevronDown, Building2, CircleDashed } from 'lucide-react'
import AdminLayout from "../layout/AdminLayout";
import Heading from "@/components/Heading";
import StatCard from "../components/StatCard";
import ManageBookingDialog from "../components/ManageBookingDialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import StatusBadge from "@/components/StatusBadge";
import KeyStatus from "../components/KeyStatus";
import type { KeyStatus as KeyStatusType } from "@/types/key";
import PaginationControls from "@/components/PaginationControls";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/SearchBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAllBookings } from "@/services/admin";
import { useFloors } from "@/services/bookings";
import { formatDateRange } from "@/utils/date-format";
import type { AdminBookingDetail } from "@/shared/types";
import StaffTooltip from "../components/StaffTooltip";

const ITEMS_PER_PAGE = 12;

const statusColors = {
  upcoming: "brightBlue",
  active: "green",
  completed: "blue",
  cancelled: "grey",
  expired: "red",
} as const;

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
];

const Bookings = () => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeBookings, setActiveBookings] = useState<number>(0);
  const [pendingHandovers, setPendingHandovers] = useState<number>(0);
  const [pendingReturns, setPendingReturns] = useState<number>(0);
  const [selectedBooking, setSelectedBooking] = useState<AdminBookingDetail | null>(null);
  const [manageDialogOpen, setManageDialogOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [floorFilter, setFloorFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: floorsData = [], isLoading: floorsLoading } = useFloors();
  const { data: bookingsData = [], isLoading: bookingsLoading } = useAllBookings();

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
    
    const matchesFloor = floorFilter === "all" || booking.floor_number === floorFilter;
    const matchesStatus = statusFilter === "all" || booking.booking_status === statusFilter;
    
    return matchesSearch && matchesFloor && matchesStatus;
  }) || [];

  const filteredTotalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const filteredStartIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const filteredEndIndex = filteredStartIndex + ITEMS_PER_PAGE;
  const paginatedFilteredBookings = filteredBookings.slice(filteredStartIndex, filteredEndIndex);

  useEffect(() => {
    const activeCount = bookingsData?.filter(b => b.booking_status === "active").length || 0;
    const pendingHandoverCount = bookingsData?.filter(b => b.key_status === "awaiting_handover").length || 0;
    const pendingReturnCount = bookingsData?.filter(b => ["awaiting_return"].includes(b.key_status as string)).length || 0;

    setActiveBookings(activeCount);
    setPendingHandovers(pendingHandoverCount);
    setPendingReturns(pendingReturnCount);
  }, [bookingsData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, floorFilter, statusFilter]);

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

        <div className="flex items-center justify-between gap-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search employee or booking..."
            className="flex-1"
          />
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="min-w-[150px] justify-between text-grey"
                  disabled={floorsLoading}
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {floorsLoading 
                      ? "Loading..." 
                      : floorFilter === "all" 
                        ? "All Floors" 
                        : `Floor ${floorFilter}`
                    }
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[150px]">
                <DropdownMenuItem onClick={() => setFloorFilter("all")}>
                  All Floors
                </DropdownMenuItem>
                {floorsData.map((floor) => (
                  <DropdownMenuItem key={floor.floor_id} onClick={() => setFloorFilter(floor.floor_number)}>
                    Floor {floor.floor_number}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[150px] justify-between text-grey">
                  <span className="flex items-center gap-2">
                    <CircleDashed className="h-4 w-4" />
                    {statusFilter === "all" ? "All Statuses" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[150px]">
                {statusOptions.map(({ value, label }) => (
                  <DropdownMenuItem key={value} onClick={() => setStatusFilter(value)}>
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>


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
                      <TableCell className="text-xs">{formatDateRange(booking.start_date, booking.end_date)}</TableCell>
                      <TableCell>
                        <StatusBadge 
                          status={booking.booking_status} 
                          color={statusColors[booking.booking_status as keyof typeof statusColors] ?? "green"} 
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
          statusColor={statusColors[selectedBooking.booking_status as keyof typeof statusColors] ?? "green"}
        />
      )}
    </AdminLayout>
  );
};

export default Bookings;

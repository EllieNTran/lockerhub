import { useEffect, useState } from "react";
import { Lock, CircleCheckBig, Wrench, ChevronDown, Building2, CircleDashed, Plus } from 'lucide-react'
import AdminLayout from "../layout/AdminLayout";
import Heading from "@/components/Heading";
import StatCard from "../components/StatCard";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import KeyStatus from "../components/KeyStatus";
import ManageLockerDialog from "../components/ManageLockerDialog";
import CreateLockerDialog from "../components/CreateLockerDialog";
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
import { useAllLockers } from "@/services/admin";
import { useFloors } from "@/services/bookings";
import type { Locker } from "@/types/locker";

const ITEMS_PER_PAGE = 12;

const statusColors = {
  available: "green",
  occupied: "brightBlue",
  maintenance: "red",
  reserved: "purple",
} as const;

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "available", label: "Available" },
  { value: "occupied", label: "Occupied" },
  { value: "maintenance", label: "Maintenance" },
  { value: "reserved", label: "Reserved" },
];

const Lockers = () => {
  const [totalLockers, setTotalLockers] = useState<number>(0);
  const [availableLockers, setAvailableLockers] = useState<number>(0);
  const [maintenanceLockers, setMaintenanceLockers] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [floorFilter, setFloorFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [manageDialogOpen, setManageDialogOpen] = useState<boolean>(false);
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);

  const { data: lockersData, isLoading: lockersLoading } = useAllLockers();
  const { data: floorsData = [], isLoading: floorsLoading } = useFloors();

  useEffect(() => {
    if (lockersData) {
      setTotalLockers(lockersData.length);
      setAvailableLockers(lockersData.filter(locker => locker.locker_status === 'available').length);
      setMaintenanceLockers(lockersData.filter(locker => locker.locker_status === 'maintenance').length);
    }
  }, [lockersData]);

  const filteredLockers = lockersData?.filter((locker) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      locker.locker_number?.toLowerCase().includes(query) ||
      locker.key_number?.toLowerCase().includes(query);
    
    const matchesFloor = floorFilter === "all" || locker.floor_number === floorFilter;
    const matchesStatus = statusFilter === "all" || locker.locker_status === statusFilter;
    
    return matchesSearch && matchesFloor && matchesStatus;
  }) || [];

  const filteredTotalPages = Math.ceil(filteredLockers.length / ITEMS_PER_PAGE);
  const filteredStartIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const filteredEndIndex = filteredStartIndex + ITEMS_PER_PAGE;
  const paginatedFilteredLockers = filteredLockers.slice(filteredStartIndex, filteredEndIndex);

  const handleLockerClick = (locker: Locker) => {
    setSelectedLocker(locker);
    setManageDialogOpen(true);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, floorFilter, statusFilter]);

  return (
    <AdminLayout>
      <main className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <Heading
            title="Lockers"
            description="View, search and update locker statuses."
          />
          <Button variant="highlight" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Create Locker
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total Lockers" value={totalLockers} icon={Lock} color="blue" />
          <StatCard label="Available" value={availableLockers} icon={CircleCheckBig} color="green" />
          <StatCard label="Under Maintenance" value={maintenanceLockers} icon={Wrench} color="red" />
        </div>

        <div className="flex items-center justify-between gap-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by locker number or key number..."
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-45 pl-8">Locker Number</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="w-45">Locker Status</TableHead>
                <TableHead>Key Number</TableHead>
                <TableHead className="w-65">Key Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lockersLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-grey">
                    Loading lockers...
                  </TableCell>
                </TableRow>
              ) : paginatedFilteredLockers.length > 0 ? (
                paginatedFilteredLockers.map((locker) => (
                  <TableRow 
                    key={locker.locker_id}
                    onClick={() => handleLockerClick(locker)}
                    className="cursor-pointer hover:bg-grey-background"
                  >
                    <TableCell className="font-medium text-dark-blue pl-8">{locker.locker_number}</TableCell>
                    <TableCell>{locker.floor_number || 'N/A'}</TableCell>
                    <TableCell>{locker.location || 'N/A'}</TableCell>
                    <TableCell>
                      <StatusBadge 
                        status={locker.locker_status || 'N/A'} 
                        color={statusColors[locker.locker_status as keyof typeof statusColors] ?? "green"} 
                      />
                    </TableCell>
                    <TableCell>{locker.key_number || 'N/A'}</TableCell>
                    <TableCell>
                      {locker.key_status ? (
                        <KeyStatus status={locker.key_status as KeyStatusType} />
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-grey">
                    {searchQuery ? 'No lockers found matching your search' : 'No lockers found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <PaginationControls
          currentPage={currentPage}
          totalPages={filteredTotalPages}
          onPageChange={setCurrentPage}
          className="mt-4 mb-4"
        />
      </main>
      {selectedLocker && (
        <ManageLockerDialog 
          locker={selectedLocker} 
          isOpen={manageDialogOpen} 
          onOpenChange={setManageDialogOpen}
          statusColor={statusColors[selectedLocker.locker_status as keyof typeof statusColors] ?? "green"}
        />
      )}
      <CreateLockerDialog 
        isOpen={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
      />
    </AdminLayout>
  );
};

export default Lockers;

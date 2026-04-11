import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router';
import { Lock, CircleCheckBig, Wrench, Plus } from 'lucide-react'
import AdminLayout from '../layout/AdminLayout'
import Heading from '@/components/Heading'
import StatCard from '../components/StatCard'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import ColorBadge from '@/components/ColorBadge'
import KeyStatus from '../components/KeyStatus'
import ManageLockerDialog from '../components/ManageLockerDialog'
import CreateLockerDialog from '../components/CreateLockerDialog'
import type { KeyStatus as KeyStatusType } from '@/types/key'
import PaginationControls from '@/components/PaginationControls'
import { Button } from '@/components/ui/button'
import { useAllLockers } from '@/services/admin'
import type { Locker } from '@/types/locker'
import Filters from '../components/Filters'
import PageTour from '@/components/tutorial/PageTour';
import { ADMIN_LOCKERS_STEPS } from '@/components/tutorial/steps';

const ITEMS_PER_PAGE = 12;

const statusColors = {
  available: 'green',
  occupied: 'brightBlue',
  maintenance: 'red',
  reserved: 'purple',
} as const;

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'reserved', label: 'Reserved' },
];

const Lockers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [floorFilter, setFloorFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [manageDialogOpen, setManageDialogOpen] = useState<boolean>(false)
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false)

  const { data: lockersData, isLoading: lockersLoading } = useAllLockers()

  useEffect(() => {
    const lockerParam = searchParams.get('locker');
    if (lockerParam) {
      setSearchQuery(lockerParam);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const totalLockers = lockersData?.length || 0
  const availableLockers = lockersData?.filter((locker) => locker.locker_status === 'available').length || 0
  const maintenanceLockers = lockersData?.filter((locker) => locker.locker_status === 'maintenance').length || 0

  const filteredLockers = lockersData?.filter((locker) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      locker.locker_number?.toLowerCase().includes(query) ||
      locker.key_number?.toLowerCase().includes(query);

    const matchesFloor = floorFilter === 'all' || locker.floor_id === floorFilter;
    const matchesStatus = statusFilter === 'all' || locker.locker_status === statusFilter;

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

  const handleAvailableClick = () => {
    setStatusFilter('available');
    setCurrentPage(1);
  };

  const handleMaintenanceClick = () => {
    setStatusFilter('maintenance');
    setCurrentPage(1);
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
          <Button variant="highlight" onClick={() => setCreateDialogOpen(true)} data-tour="admin-lockers-create-btn">
            <Plus className="mr-1 h-4 w-4" />
            Create Locker
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-tour="admin-lockers-stats">
          <StatCard label="Total Lockers" value={totalLockers} icon={Lock} color="blue" />
          <StatCard
            label="Available"
            value={availableLockers}
            icon={CircleCheckBig}
            color="green"
            onClick={handleAvailableClick}
          />
          <StatCard
            label="Under Maintenance"
            value={maintenanceLockers}
            icon={Wrench}
            color="red"
            onClick={handleMaintenanceClick}
          />
        </div>

        <div data-tour="admin-lockers-filters">
          <Filters
            statusOptions={STATUS_OPTIONS}
            placeholder="Search by locker number or key number..."
            searchQuery={searchQuery}
            floorFilter={floorFilter}
            statusFilter={statusFilter}
            onSearchChange={setSearchQuery}
            onFloorChange={setFloorFilter}
            onStatusChange={setStatusFilter}
          />
        </div>

        <div className="rounded-xl border border-grey-outline bg-white shadow-sm" data-tour="admin-lockers-table">
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
                paginatedFilteredLockers.map((locker, index) => (
                  <TableRow
                    key={locker.locker_id}
                    onClick={() => handleLockerClick(locker)}
                    className="cursor-pointer hover:bg-grey-background"
                    data-tour={index === 0 ? 'admin-locker-row' : undefined}
                  >
                    <TableCell className="font-medium text-dark-blue pl-8">{locker.locker_number}</TableCell>
                    <TableCell>{locker.floor_number || 'N/A'}</TableCell>
                    <TableCell>{locker.location || 'N/A'}</TableCell>
                    <TableCell>
                      <ColorBadge
                        status={locker.locker_status || 'N/A'}
                        color={statusColors[locker.locker_status as keyof typeof statusColors] ?? 'green'}
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
          statusColor={statusColors[selectedLocker.locker_status as keyof typeof statusColors] ?? 'green'}
        />
      )}
      <CreateLockerDialog
        isOpen={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <PageTour steps={ADMIN_LOCKERS_STEPS} pageName="Admin Lockers" />
    </AdminLayout>
  );
};

export default Lockers;

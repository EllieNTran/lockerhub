import { useState } from 'react';
import { Loader, FileText, LoaderCircle, CalendarDays } from 'lucide-react'
import AdminLayout from '../layout/AdminLayout';
import Heading from '@/components/Heading';
import StatCard from '../components/StatCard';
import SpecialRequestCard from '@/components/SpecialRequestCard';
import { useAllSpecialRequests, useReviewSpecialRequest } from '@/services/admin';
import Filters from '../components/Filters';
import PageTour from '@/components/tutorial/PageTour';
import { ADMIN_SPECIAL_REQUESTS_STEPS } from '@/components/tutorial/steps';
import { toast } from '@/components/ui/sonner';
import type { AxiosError } from 'axios';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'active', label: 'Active' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
]

const SpecialRequests = () => {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [floorFilter, setFloorFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: specialRequests, isLoading } = useAllSpecialRequests()

  const reviewMutation = useReviewSpecialRequest()

  const handleReview = (requestId: number, approved: boolean, reason?: string) => {
    reviewMutation.mutate({
      requestId: requestId.toString(),
      data: {
        status: approved ? 'approved' : 'rejected',
        ...(reason && { reason }),
      },
    }, {
      onSuccess: () => {
        toast.success(`Request ${approved ? 'approved' : 'rejected'} successfully`);
      },
      onError: (error: Error) => {
        const axiosError = error as AxiosError<{ detail: string }>;
        toast.error(axiosError?.response?.data?.detail || `Failed to ${approved ? 'approve' : 'reject'} request`);
      },
    })
  }

  const filteredRequests = specialRequests?.filter((request) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      request.employee_name?.toLowerCase().includes(query) ||
      request.staff_number?.toLowerCase().includes(query)

    const matchesFloor = floorFilter === 'all' || request.floor_id === floorFilter
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter

    return matchesSearch && matchesFloor && matchesStatus
  }) || []

  const pendingCount = specialRequests?.filter((r) => r.status === 'pending').length || 0
  const activeCount = specialRequests?.filter((r) => r.status === 'active').length || 0

  return (
    <AdminLayout>
      <main className="w-full space-y-6">
        <Heading
          title="Special Requests"
          description="Review extended or permanent locker allocation requests."
        />
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2" data-tour="admin-special-requests-stats">
          <StatCard
            label="Pending Review"
            value={pendingCount}
            icon={Loader}
            color="orange"
          />
          <StatCard
            label="Active Requests"
            value={activeCount}
            icon={CalendarDays}
            color="brightBlue"
          />
        </div>

        <div data-tour="admin-special-requests-filters">
          <Filters
            statusOptions={STATUS_OPTIONS}
            placeholder="Search by employee name or staff number..."
            searchQuery={searchQuery}
            floorFilter={floorFilter}
            statusFilter={statusFilter}
            onSearchChange={setSearchQuery}
            onFloorChange={setFloorFilter}
            onStatusChange={setStatusFilter}
          />
        </div>

        { isLoading ? (
          <div className="flex items-center justify-center py-10">
            <LoaderCircle className="h-12 w-12 animate-spin text-grey" />
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <SpecialRequestCard
                key={request.request_id}
                specialRequest={request}
                onReview={(approved, reason) => handleReview(request.request_id, approved, reason)}
                isAdmin
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-grey/40">
            <FileText className="h-15 w-15 mb-4" />
            <p className="text-md w-50">{searchQuery || floorFilter !== 'all' || statusFilter !== 'all'
              ? 'No special requests found matching your filters'
              : 'No special requests found'}
            </p>
          </div>
        )}
      </main>
      <PageTour steps={ADMIN_SPECIAL_REQUESTS_STEPS} pageName="Admin Special Requests" />
    </AdminLayout>
  );
};

export default SpecialRequests;

import { useState } from 'react';
import { useNavigate } from 'react-router';
import UserLayout from '../layout/UserLayout';
import Heading from '@/components/Heading';
import SpecialRequestCard from '../../../shared/components/SpecialRequestCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserSpecialRequests, useCancelSpecialRequest } from '@/services/bookings';
import { toast } from '@/components/ui/sonner';
import { SPECIAL_REQUEST_STEPS } from '@/components/tutorial/steps';
import PageTour from '@/components/tutorial/PageTour';
import PaginationControls from '@/components/PaginationControls';

const REQUESTS_PER_PAGE = 8;

const SpecialRequests = () => {
  const navigate = useNavigate();

  const { data: requestsData, isLoading } = useUserSpecialRequests();
  const mutation = useCancelSpecialRequest();
  const [currentPage, setCurrentPage] = useState<Record<string, number>>({
    all: 1,
    active: 1,
    approved: 1,
    pending: 1,
    rejected: 1,
    cancelled: 1,
  });

  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'approved', label: 'Approved' },
    { value: 'pending', label: 'Pending' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const filterRequests = (status: string) => {
    if (!requestsData) return [];
    if (status === 'all') return requestsData;
    return requestsData.filter(r => r.status === status);
  };

  const getPaginatedRequests = (status: string) => {
    const filteredRequests = filterRequests(status);
    const page = currentPage[status] || 1;
    const startIndex = (page - 1) * REQUESTS_PER_PAGE;
    const endIndex = startIndex + REQUESTS_PER_PAGE;
    return filteredRequests.slice(startIndex, endIndex);
  };

  const getTotalPages = (status: string) => {
    const filteredRequests = filterRequests(status);
    return Math.ceil(filteredRequests.length / REQUESTS_PER_PAGE);
  };

  const handlePageChange = (status: string, page: number) => {
    setCurrentPage(prev => ({ ...prev, [status]: page }));
  };

  const handleCancel = (request_id: number) => {
    mutation.mutate(request_id, {
      onSuccess: () => {
        toast.success(`Cancelled special request #${request_id}`);
      },
    });
  };

  return (
    <UserLayout>
      <div className="w-full">
      <main className="container max-w-6xl px-6 py-8 mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Heading
            title="Special Requests"
            description="Submit a special request for bookings longer than 3 days or permanent allocation."
          />
          <Button
            variant="highlight"
            onClick={() => navigate('/user/special-request/new')}
            data-tour="new-special-request-btn"
          >
            <Plus className="mr-1 h-4 w-4" />
            New Request
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6" data-tour="special-requests-tabs">
            {tabs.map((tab) => {
              const count = filterRequests(tab.value).length;
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
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
                  <p className="text-sm text-grey">Loading special requests...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 min-h-[400px]">
                    {getPaginatedRequests(tab.value).length > 0 ? (
                      getPaginatedRequests(tab.value).map((request, index) => (
                        <div key={request.request_id} data-tour={index === 0 ? 'special-request-card' : undefined}>
                          <SpecialRequestCard
                            key={request.request_id}
                            specialRequest={request}
                            onCancel={() => handleCancel(request.request_id)}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-grey/40">
                        <FileText className="h-15 w-15 mb-4" />
                        <p className="text-md">No {tab.label !== 'All' ? tab.label.toLowerCase() : 'special'} requests found</p>
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
      </div>
      <PageTour steps={SPECIAL_REQUEST_STEPS} pageName="Special Requests" />
    </UserLayout>
  );
};

export default SpecialRequests;

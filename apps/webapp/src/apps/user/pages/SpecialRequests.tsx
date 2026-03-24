import { useNavigate } from 'react-router';
import UserLayout from '../layout/UserLayout';
import Heading from '@/components/Heading';
import SpecialRequestCard from '../../../shared/components/SpecialRequestCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useUserSpecialRequests, useDeleteSpecialRequest } from '@/services/bookings';
import { toast } from '@/components/ui/sonner';

const SpecialRequests = () => {
  const navigate = useNavigate();

  const { data: requestsData, isLoading } = useUserSpecialRequests();
  const mutation = useDeleteSpecialRequest();

  const tabs = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'active', label: 'Active' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'all', label: 'All' },
  ];

  const filterRequests = (status: string) => {
    if (!requestsData) return [];
    if (status === 'all') return requestsData;
    return requestsData.filter(r => r.status === status);
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
          <Button variant="highlight" onClick={() => navigate('/user/special-request/new')}>
            <Plus className="mr-1 h-4 w-4" />
            New Request
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
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
                <div className="space-y-4 min-h-[400px]">
                  {filterRequests(tab.value).length > 0 ? (
                    filterRequests(tab.value).map((request) => (
                      <SpecialRequestCard
                        key={request.request_id}
                        specialRequest={request}
                        onCancel={() => handleCancel(request.request_id)}
                      />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-grey/40">
                      <FileText className="h-15 w-15 mb-4" />
                      <p className="text-md">No {tab.label.toLowerCase()} requests found</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
      </div>
    </UserLayout>
  );
};

export default SpecialRequests;

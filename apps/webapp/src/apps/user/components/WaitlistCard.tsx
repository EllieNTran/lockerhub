import { Clock, Calendar, MapPin, X } from 'lucide-react';
import { format } from 'date-fns';
import type { UserQueueEntry } from '@/services/bookings/services/waiting-list';
import { useDeleteUserQueue } from '@/services/bookings';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';

interface WaitlistCardProps {
  queueEntries: UserQueueEntry[];
  isLoading?: boolean;
}

const WaitlistCard = ({ queueEntries, isLoading }: WaitlistCardProps) => {
  const { mutate: deleteQueue, isPending: isDeleting } = useDeleteUserQueue();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [queueToDelete, setQueueToDelete] = useState<{ id: number; floorNumber: string; startDate: string; endDate: string } | null>(null);

  const handleDeleteClick = (queue: UserQueueEntry) => {
    setQueueToDelete({
      id: queue.floor_queue_id,
      floorNumber: queue.floor_number,
      startDate: queue.start_date,
      endDate: queue.end_date,
    });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!queueToDelete) return;

    deleteQueue(queueToDelete.id, {
      onSuccess: () => {
        toast.success('Removed from waitlist', {
          description: `You've been removed from Floor ${queueToDelete.floorNumber} waitlist.`,
        });
        setDeleteDialogOpen(false);
        setQueueToDelete(null);
      },
      onError: () => {
        toast.error('Failed to remove from waitlist', {
          description: 'Please try again later.',
        });
      },
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-sm text-grey">Loading...</p>;
    }

    if (queueEntries.length === 0) {
      return <p className="text-sm text-grey">You are currently not on any waitlists.</p>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {queueEntries.map((queue) => (
          <div
            key={queue.floor_queue_id}
            className="rounded-lg border border-grey-outline/50 bg-secondary/5 p-3 relative group"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteClick(queue)}
              disabled={isDeleting}
              className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white border border-grey-outline/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red hover:border-red hover:text-white disabled:opacity-50"
              aria-label="Remove from waitlist"
            >
              <X className="h-3 w-3" />
            </Button>

            <div className="mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-secondary" />
              <span className="text-sm font-medium text-dark-blue">
                Floor {queue.floor_number}
              </span>
            </div>

            <div className="space-y-1 text-xs text-grey">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                <span>
                  {format(new Date(queue.start_date), 'MMM dd')} - {format(new Date(queue.end_date), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                <span>Joined {format(new Date(queue.created_at), 'MMM dd, yyyy')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="mt-6 rounded-xl border border-grey-outline bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-secondary" />
          <h3 className="text-base font-semibold text-dark-blue">My Waitlists</h3>
          {!isLoading && queueEntries.length > 0 && (
            <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
              {queueEntries.length}
            </span>
          )}
        </div>

        {renderContent()}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from Waitlist</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove yourself from this waitlist?
            </DialogDescription>
          </DialogHeader>
          {queueToDelete && (
            <div className="space-y-3 rounded-lg bg-muted p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-grey">Floor</span>
                <span className="font-medium">Floor {queueToDelete.floorNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-grey">Period</span>
                <span className="font-medium">
                  {format(new Date(queueToDelete.startDate), 'MMM d')} — {format(new Date(queueToDelete.endDate), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Removing...' : 'Remove from Waitlist'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WaitlistCard;

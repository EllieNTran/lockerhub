import { useState, useEffect } from 'react';
import { CalendarDays, X, KeyRound, AlertTriangle } from 'lucide-react'
import { format } from "date-fns";
import type { AdminBookingDetail } from "@/shared/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { toast } from "sonner";
import { useConfirmHandover, useConfirmReturn, useCancelBooking } from "@/services/admin";
import { useSendOverdueKeyReturnReminder } from '@/services/notifications';
import type { AxiosError } from 'axios';

interface ManageBookingDialogProps {
  booking: AdminBookingDetail,
  isOpen: boolean,
  onOpenChange: (open: boolean) => void,
  statusColor: "green" | "brightBlue" | "red" | "purple" | "blue" | "pink" | "grey",
}

const ManageBookingDialog = ({ booking, isOpen, onOpenChange, statusColor }: ManageBookingDialogProps) => {
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const { mutate: confirmHandover, isPending: isConfirmingHandover } = useConfirmHandover();
  const { mutate: confirmReturn, isPending: isConfirmingReturn } = useConfirmReturn();
  const { mutate: cancelBooking, isPending: isCancelling } = useCancelBooking();
  const { mutate: sendOverdueKeyReturnReminder, isPending: isSendingOverdueKeyReturnReminder } = useSendOverdueKeyReturnReminder();

  useEffect(() => {
    if (isOpen) {
      setShowCancelConfirmation(false);
    }
  }, [isOpen]);

  const handleConfirmHandover = () => {
    confirmHandover({ bookingId: booking.booking_id }, {
      onSuccess: () => {
        toast.success('Key handover confirmed');
        onOpenChange(false);
      },
      onError: (error: Error) => {
        const axiosError = error as AxiosError<{ detail: string }>;
        toast.error(axiosError?.response?.data?.detail || 'Failed to confirm handover');
      },
    });
  };

  const handleConfirmReturn = () => {
    confirmReturn({ bookingId: booking.booking_id }, {
      onSuccess: () => {
        toast.success('Key return confirmed');
        onOpenChange(false);
      },
      onError: (error: Error) => {
        const axiosError = error as AxiosError<{ detail: string }>;
        toast.error(axiosError?.response?.data?.detail || 'Failed to confirm return');
      },
    });
  };

  const handleSendReminder = () => {
    sendOverdueKeyReturnReminder({
      userId: booking.user_id,
      email: booking.email,
      name: booking.employee_name,
      lockerNumber: booking.locker_number,
      floorNumber: booking.floor_number,
      startDate: booking.start_date,
      endDate: booking.end_date || '',
      keyNumber: booking.key_number || '',
      keyReturnPath: '/user/return-key',
    }, {
      onSuccess: () => {
        toast.success('Overdue key return reminder sent');
        onOpenChange(false);
      },
      onError: (error: Error) => {
        const axiosError = error as AxiosError<{ detail: string }>;
        toast.error(axiosError?.response?.data?.detail || 'Failed to send overdue key return reminder');
      },
    });
  };

  const handleCancelClick = () => {
    if (booking?.booking_status === 'active' || booking?.booking_status === 'expired') {
      setShowCancelConfirmation(true);
    } else {
      handleConfirmCancel();
    }
  };

  const handleConfirmCancel = () => {
    cancelBooking(booking.booking_id, {
      onSuccess: () => {
        toast.success('Booking cancelled');
        onOpenChange(false);
        setShowCancelConfirmation(false);
      },
      onError: (error: Error) => {
        const axiosError = error as AxiosError<{ detail: string }>;
        toast.error(axiosError?.response?.data?.detail || 'Failed to cancel booking');
      },
    });
  };

  const renderCancelConfirmation = () => {
    if (!booking?.key_number) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-grey">
            Are you sure you want to cancel this booking?
          </p>
          <Button
            onClick={handleConfirmCancel}
            disabled={isCancelling}
            variant="destructive"
            className="w-full"
          >
            <X className="mr-2 h-4 w-4" />
            {isCancelling ? 'Cancelling...' : 'Confirm & Cancel Booking'}
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-grey">
          To cancel this booking, please confirm that the user has returned locker key <span className="font-medium text-dark-blue">{booking.key_number}</span>.
        </p>
        <Button
          onClick={handleConfirmCancel}
          disabled={isCancelling}
          variant="destructive"
          className="w-full"
        >
          <X className="mr-2 h-4 w-4" />
          {isCancelling ? 'Cancelling...' : 'Confirm'}
        </Button>
      </div>
    );
  };

  const isStartDateTodayOrEarlier = () => {
    if (!booking?.start_date) return false;
    const today = new Date().setHours(0, 0, 0, 0);
    const startDate = new Date(booking.start_date).setHours(0, 0, 0, 0);
    return startDate <= today;
  };

  const renderActions = () => {
    if (showCancelConfirmation) {
      return renderCancelConfirmation();
    }

    switch (booking?.booking_status) {
      case 'upcoming':
        return (
          <>
            {booking?.key_number && isStartDateTodayOrEarlier() ? (
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-start h-12 font-normal"
                onClick={handleConfirmHandover}
                disabled={isConfirmingHandover}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                {isConfirmingHandover ? 'Confirming...' : 'Confirm Key Handover'}
              </Button>
            ) : !booking?.key_number ? (
              <p className="text-sm text-grey">This locker has no key to hand over.</p>
            ) : (
              <div className="text-sm">
                <span className="text-grey">Key handover available on </span>
                <span className="font-medium">{format(new Date(booking.start_date), 'PPP')}</span>
              </div>
            )}
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-start h-12 font-normal"
              onClick={handleCancelClick}
              disabled={isCancelling}
            >
              <X className="mr-2 h-4 w-4" />
              {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          </>
        );
      case 'active':
        return (
          <>
            {booking?.key_number ? (
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-start h-12 font-normal"
                onClick={handleConfirmReturn}
                disabled={isConfirmingReturn}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {isConfirmingReturn ? 'Confirming...' : 'Confirm Key Return'}
              </Button>
            ) : (
              <p className="text-sm text-grey">This locker has no key to return.</p>
            )}
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-start h-12 font-normal"
              onClick={handleCancelClick}
              disabled={isCancelling}
            >
              <X className="mr-2 h-4 w-4" />
              {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          </>
        );
      case 'expired':
        return (
          <>
            {booking?.key_number ? (
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-start h-12 font-normal"
                onClick={handleConfirmReturn}
                disabled={isConfirmingReturn}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {isConfirmingReturn ? 'Confirming...' : 'Confirm Key Return'}
              </Button>
            ) : (
              <p className="text-sm text-grey">This locker has no key to return.</p>
            )}
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-start h-12 font-normal"
              onClick={handleSendReminder}
              disabled={isSendingOverdueKeyReturnReminder}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              {isSendingOverdueKeyReturnReminder ? 'Sending...' : 'Send Reminder'}
            </Button>
          </>
        );
      default:
        return (
          <p className="text-sm text-grey">No actions available</p>
        );
    }
  };

  return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">Booking for Locker {booking?.locker_number || 'N/A'}</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              Current Status:
              <StatusBadge 
                status={booking?.booking_status || 'N/A'} 
                color={statusColor} 
              />
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm font-medium">
              {showCancelConfirmation ? 'Cancel Booking Confirmation' : 'Available Actions'}
            </p>
            {renderActions()}
          </div>
        </DialogContent>
      </Dialog>
  );
}

export default ManageBookingDialog;

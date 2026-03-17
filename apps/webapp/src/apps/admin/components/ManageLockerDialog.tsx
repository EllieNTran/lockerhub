import { useState } from 'react';
import { CalendarDays, Wrench, CircleCheckBig, X, KeyRound, AlertTriangle } from 'lucide-react'
import type { Locker } from "@/shared/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { useMarkLockerMaintenance, useReportLostKey, useOrderReplacementKey, useMarkLockerAvailable } from "@/services/admin";
import { toast } from "sonner";

interface ManageLockerDialogProps {
  locker: Locker,
  isOpen: boolean,
  onOpenChange: (open: boolean) => void,
  statusColor: "green" | "brightBlue" | "red" | "purple" | "blue" | "pink",
}

const ManageLockerDialog = ({ locker, isOpen, onOpenChange, statusColor }: ManageLockerDialogProps) => {
  const [showMaintenanceOptions, setShowMaintenanceOptions] = useState(false);
  
  const markMaintenanceMutation = useMarkLockerMaintenance();
  const reportLostKeyMutation = useReportLostKey();
  const orderReplacementKeyMutation = useOrderReplacementKey();
  const markAvailableMutation = useMarkLockerAvailable();

  const handleMaintenanceClick = () => {
    if (!locker?.key_number) {
      handleLockerFault();
    } else {
      setShowMaintenanceOptions(true);
    }
  };

  const handleLockerFault = async () => {
    try {
      await markMaintenanceMutation.mutateAsync(locker.locker_id);
      toast.success('Locker marked as under maintenance');
      onOpenChange(false);
      setShowMaintenanceOptions(false);
    } catch {
      toast.error('Failed to mark locker as under maintenance');
    }
  };

  const handleKeyReplacement = async () => {
    try {
      await reportLostKeyMutation.mutateAsync(locker.locker_id);
      toast.success('Key reported as lost and locker marked for maintenance');
      onOpenChange(false);
      setShowMaintenanceOptions(false);
    } catch {
      toast.error('Failed to report lost key');
    }
  };

  const handleOrderReplacement = async () => {
    try {
      await orderReplacementKeyMutation.mutateAsync(locker.locker_id);
      toast.success('Marked replacement key as ordered');
      onOpenChange(false);
      setShowMaintenanceOptions(false);
    } catch {
      toast.error('Failed to mark replacement key as ordered');
    }
  };

  const handleMarkFixed = async () => {
    try {
      await markAvailableMutation.mutateAsync(locker.locker_id);
      toast.success('Locker marked as fixed and available');
      onOpenChange(false);
    } catch {
      toast.error('Failed to mark locker as fixed');
    }
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setShowMaintenanceOptions(false);
    }
    onOpenChange(open);
  };

  const renderMaintenanceOptions = () => {
    return (
      <>
        <p className="text-sm text-grey mb-3">Please select the reason for maintenance:</p>
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-start h-12 font-normal"
          onClick={handleLockerFault}
          disabled={markMaintenanceMutation.isPending}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Locker Needs Fixing
        </Button>
        {locker?.key_number && (
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-start h-12 font-normal"
            onClick={handleKeyReplacement}
            disabled={reportLostKeyMutation.isPending}
          >
            <KeyRound className="mr-2 h-4 w-4" />
            Key Needs Replacement
          </Button>
        )}
      </>
    );
  };

  const renderActions = () => {
    if (showMaintenanceOptions) {
      return renderMaintenanceOptions();
    }

    switch (locker?.locker_status) {
      case 'available':
        return (
          <>
            <Button variant="outline" className="w-full flex items-center justify-start h-12 font-normal">
              <CalendarDays className="mr-2 h-4 w-4" />
              Create Manual Booking
            </Button>
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-start h-12 font-normal"
              onClick={handleMaintenanceClick}
            >
              <Wrench className="mr-2 h-4 w-4" />
              Mark Under Maintenance
            </Button>
          </>
        );
      
      case 'occupied':
        return (
          <Button variant="outline" className="w-full flex items-center justify-start h-12 font-normal">
            <X className="mr-2 h-4 w-4" />
            End Booking
          </Button>
        );
      
      case 'maintenance':
        return (
          <>
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-start h-12 font-normal"
              onClick={handleMarkFixed}
              disabled={markAvailableMutation.isPending}
            >
              <CircleCheckBig className="mr-2 h-4 w-4" />
              Mark as Fixed
            </Button>
            {locker?.key_status === 'lost' && (
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-start h-12 font-normal"
                onClick={handleOrderReplacement}
                disabled={orderReplacementKeyMutation.isPending}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Mark Replacement Key as Ordered
              </Button>
            )}
          </>
        );
      
      case 'reserved':
        return (
          <Button variant="outline" className="w-full flex items-center justify-start h-12 font-normal">
            <X className="mr-2 h-4 w-4" />
            Cancel Upcoming Booking
          </Button>
        );
      
      default:
        return (
          <p className="text-sm text-grey">No actions available</p>
        );
    }
  };

  return (
      <Dialog open={isOpen} onOpenChange={handleDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Locker: {locker?.locker_number}</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              Current Status:
              <StatusBadge 
                status={locker?.locker_status || 'N/A'} 
                color={statusColor} 
              />
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm font-medium">
              {showMaintenanceOptions ? 'Maintenance Reason' : 'Available Actions:'}
            </p>
            {renderActions()}
          </div>
        </DialogContent>
      </Dialog>
  );
}

export default ManageLockerDialog;

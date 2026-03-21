import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { CalendarDays, Wrench, CircleCheckBig, KeyRound, AlertTriangle, Search } from 'lucide-react'
import { format } from "date-fns";
import type { Locker } from "@/shared/types";
import type { User } from "@/types/user";
import { cn } from "@/shared/utils/cn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DateRangePicker } from "@/components/DateRangePicker";
import StatusBadge from "@/components/StatusBadge";
import { useMarkLockerMaintenance, useReportLostKey, useOrderReplacementKey, useMarkLockerAvailable, useAllUsers, useCreateAdminBooking, useCreateLockerKey, useAllKeys } from "@/services/admin";
import { toast } from "sonner";
import type { AxiosError } from 'axios';

interface ManageLockerDialogProps {
  locker: Locker,
  isOpen: boolean,
  onOpenChange: (open: boolean) => void,
  statusColor: "green" | "brightBlue" | "red" | "purple" | "blue" | "pink",
}

const ManageLockerDialog = ({ locker, isOpen, onOpenChange, statusColor }: ManageLockerDialogProps) => {
  const [showMaintenanceOptions, setShowMaintenanceOptions] = useState(false);
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [keyNumber, setKeyNumber] = useState("");
  const [keyNumberError, setKeyNumberError] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  const markMaintenanceMutation = useMarkLockerMaintenance();
  const reportLostKeyMutation = useReportLostKey();
  const orderReplacementKeyMutation = useOrderReplacementKey();
  const markAvailableMutation = useMarkLockerAvailable();
  const createAdminBookingMutation = useCreateAdminBooking();
  const createLockerKeyMutation = useCreateLockerKey();
  const { data: usersData = [], isLoading: usersLoading } = useAllUsers();
  const { data: keysData = [] } = useAllKeys();

  useEffect(() => {
    if (isOpen) {
      setShowMaintenanceOptions(false);
      setShowManualBooking(false);
      setShowCreateKey(false);
      setKeyNumber("");
      setKeyNumberError("");
      setUserSearchQuery("");
      setSelectedUser(null);
      setShowUserDropdown(false);
      setStartDate(undefined);
      setEndDate(undefined);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!keyNumber.trim()) {
      setKeyNumberError("");
      return;
    }

    const validateKeyNumber = () => {
      const keyExists = keysData.some(
        (key) => key.key_number === keyNumber.trim()
      );
      
      if (keyExists) {
        setKeyNumberError("A key with this number already exists");
      } else {
        setKeyNumberError("");
      }
    };

    const timeoutId = setTimeout(validateKeyNumber, 300);
    return () => clearTimeout(timeoutId);
  }, [keyNumber, keysData]);

  const filteredUsers = usersData.filter((user) => {
    const query = userSearchQuery.toLowerCase();
    return (
      user.employee_name.toLowerCase().includes(query) ||
      user.staff_number.toLowerCase().includes(query)
    );
  });

  const handleManualBookingClick = () => {
    setShowManualBooking(true);
  };

  const handleCreateKeyClick = () => {
    setShowCreateKey(true);
  };

  const handleCreateKey = async () => {
    if (!keyNumber.trim()) {
      toast.error('Key number is required');
      return;
    }

    if (keyNumberError) {
      toast.error('Please fix the key number error before submitting');
      return;
    }

    try {
      await createLockerKeyMutation.mutateAsync({
        lockerId: locker.locker_id,
        keyNumber: keyNumber.trim(),
      });
      toast.success('Key created successfully');
      onOpenChange(false);
      setShowCreateKey(false);
    } catch (error) {
      toast.error((error as AxiosError<{ detail: string }>)?.response?.data?.detail || 'Failed to create key');
    }
  };

  const handleUserSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setUserSearchQuery(newQuery);
    if (selectedUser && newQuery !== `${selectedUser.staff_number} - ${selectedUser.employee_name}`) {
      setSelectedUser(null);
    }
  };

  const handleInputFocus = () => {
    setShowUserDropdown(true);
    if (selectedUser) {
      setUserSearchQuery("");
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setUserSearchQuery(`${user.staff_number} - ${user.employee_name}`);
    setShowUserDropdown(false);
  };

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

  const handleCreateBooking = async () => {
    if (!selectedUser || !startDate || !endDate) {
      toast.error('Please select a user and date range for the booking');
      return;
    }

    try {
      await createAdminBookingMutation.mutateAsync({
        user_id: selectedUser.user_id,
        locker_id: locker.locker_id,
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : '',
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : '',
      });
      toast.success('Booking created successfully');
      onOpenChange(false);
      setShowManualBooking(false);
    } catch {
      toast.error('Failed to create booking');
    }
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setShowMaintenanceOptions(false);
      setShowManualBooking(false);
      setShowCreateKey(false);
      setKeyNumber("");
      setKeyNumberError("");
      setUserSearchQuery("");
      setSelectedUser(null);
      setShowUserDropdown(false);
      setStartDate(undefined);
      setEndDate(undefined);
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

  const renderManualBookingForm = () => {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="user-search">Select User</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-grey" />
            <Input
              id="user-search"
              placeholder="Search by name or staff number..."
              value={userSearchQuery}
              onChange={handleUserSearchChange}
              onFocus={handleInputFocus}
              className="pl-10"
            />
          </div>
          {showUserDropdown && (
            <ScrollArea className={cn(
              "rounded-md border border-grey-outline",
              filteredUsers.length > 0 ? "h-[200px]" : "h-auto"
            )}>
              {usersLoading ? (
                <div className="p-4 text-sm text-grey text-center">Loading users...</div>
              ) : filteredUsers.length > 0 ? (
                <div className="p-1">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.user_id}
                      onClick={() => handleUserSelect(user)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                    >
                      <div className="font-medium text-dark-blue">{user.employee_name}</div>
                      <div className="text-xs text-grey">{user.staff_number}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-sm text-grey text-center">No users found</div>
              )}
            </ScrollArea>
          )}
        </div>

        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          disableWeekends={true}
          disablePastDates={true}
          maxDaysRange={2}
        />

        <Button 
          variant="default" 
          className="w-full"
          onClick={handleCreateBooking}
          disabled={!selectedUser || !startDate || !endDate || createAdminBookingMutation.isPending}
        >
          Create Booking
        </Button>
      </div>
    );
  };

  const renderCreateKeyForm = () => {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="keyNumber">
            Key Number <span className="text-error">*</span>
          </Label>
          <Input
            id="keyNumber"
            placeholder="e.g., AA123"
            value={keyNumber}
            onChange={(e) => setKeyNumber(e.target.value)}
            disabled={createLockerKeyMutation.isPending}
          />
          {keyNumberError && (
            <p className="text-xs text-error">{keyNumberError}</p>
          )}
          {!keyNumberError && keyNumber.trim().length > 0 && (
            <p className="text-xs text-success">✓ Key number is available</p>
          )}
        </div>

        <Button 
          variant="default" 
          className="w-full"
          onClick={handleCreateKey}
          disabled={!keyNumber.trim() || !!keyNumberError || createLockerKeyMutation.isPending}
        >
          {createLockerKeyMutation.isPending ? 'Creating...' : 'Create Key'}
        </Button>
      </div>
    );
  };

  const renderCreateKeyButton = () => {
    if (locker?.key_number) return null;
    
    return (
      <Button 
        variant="outline" 
        className="w-full flex items-center justify-start h-12 font-normal"
        onClick={handleCreateKeyClick}
      >
        <KeyRound className="mr-2 h-4 w-4" />
        Create Key
      </Button>
    );
  };

  const renderActions = () => {
    if (showMaintenanceOptions) {
      return renderMaintenanceOptions();
    }

    if (showManualBooking) {
      return renderManualBookingForm();
    }

    if (showCreateKey) {
      return renderCreateKeyForm();
    }

    switch (locker?.locker_status) {
      case 'available':
        return (
          <>
            {renderCreateKeyButton()}
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-start h-12 font-normal"
              onClick={handleManualBookingClick}
            >
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
          <>
            <div className="space-y-2">
              <p className="text-sm text-grey">
                This locker is currently occupied. To end the booking and confirm key return, go to the{' '}
                <Link to="/admin/bookings" className="font-medium text-dark-blue hover:text-secondary hover:underline">
                  Bookings
                </Link>{' '}
                page.
              </p>
            </div>
            {renderCreateKeyButton()}
          </>
        );
      
      case 'maintenance':
        return (
          <>
            {renderCreateKeyButton()}
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
          <>
            <div className="space-y-2">
              <p className="text-sm text-grey">
                This locker is reserved for an upcoming booking. To cancel the booking, go to the{' '}
                <Link to="/admin/bookings" className="font-medium text-dark-blue hover:text-secondary hover:underline">
                  Bookings
                </Link>{' '}
                page.
              </p>
            </div>
            {renderCreateKeyButton()}
          </>
        );
      
      default:
        return (
          <>
            {locker?.key_number && (
              <p className="text-sm text-grey">No actions available</p>
            )}
          </>
        );
    }
  };

  return (
      <Dialog open={isOpen} onOpenChange={handleDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">Locker: {locker?.locker_number}</DialogTitle>
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
              {showMaintenanceOptions ? 'Maintenance Reason' : showManualBooking ? 'Manual Booking' : showCreateKey ? '' : 'Available Actions:'}
            </p>
            {renderActions()}
          </div>
        </DialogContent>
      </Dialog>
  );
}

export default ManageLockerDialog;

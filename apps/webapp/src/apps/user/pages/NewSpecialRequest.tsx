import { useNavigate, Link } from 'react-router';
import { useState, useEffect, type SetStateAction } from 'react';
import UserLayout from '../layout/UserLayout';
import { ArrowLeft, FileText, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TextArea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '@/components/DateRangePicker';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, differenceInDays } from 'date-fns';
import { toast } from '@/components/ui/sonner';
import { useFloors, useAvailableLockers, useCreateSpecialRequest } from '@/services/bookings';
import FloorDropdown from '@/components/FloorDropdown';
import PageTour from '@/components/tutorial/PageTour';
import { SPECIAL_REQUEST_STEPS } from '@/components/tutorial/steps';

const NewSpecialRequest = () => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isPermanent, setIsPermanent] = useState(false);
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');
  const [selectedLockerId, setSelectedLockerId] = useState<string>('');
  const [justification, setJustification] = useState('');
  const [isDateRangeTooShort, setIsDateRangeTooShort] = useState(false);

  const { data: floors = [] } = useFloors();
  const { mutate: createSpecialRequest, isPending } = useCreateSpecialRequest();

  const getQueryEndDate = () => {
    if (isPermanent && startDate) {
      const oneYearLater = new Date(startDate);
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      return format(oneYearLater, 'yyyy-MM-dd');
    }
    return endDate ? format(endDate, 'yyyy-MM-dd') : '';
  };

  const { data: availableLockers = [] } = useAvailableLockers({
    floor_id: selectedFloorId,
    start_date: startDate ? format(startDate, 'yyyy-MM-dd') : '',
    end_date: getQueryEndDate(),
  });

  useEffect(() => {
    if (floors.length > 0 && !selectedFloorId) {
      setSelectedFloorId(floors[0].floor_id);
    }
  }, [floors, selectedFloorId]);

  useEffect(() => {
    if (isPermanent) {
      setEndDate(undefined);
      setSelectedLockerId('');
    }
  }, [isPermanent]);

  useEffect(() => {
    setSelectedLockerId('');
  }, [selectedFloorId]);

  useEffect(() => {
    if (!isPermanent && startDate && endDate) {
      const daysDifference = differenceInDays(endDate, startDate);
      setIsDateRangeTooShort(daysDifference <= 3);
    } else {
      setIsDateRangeTooShort(false);
    }
  }, [startDate, endDate, isPermanent]);

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();

    if (!selectedFloorId) {
      toast.error('Please select a floor');
      return;
    }

    if (!startDate) {
      toast.error('Please select a start date');
      return;
    }

    if (!isPermanent && !endDate) {
      toast.error("Please select an end date or check 'Permanent Allocation'");
      return;
    }

    if (!justification.trim()) {
      toast.error('Please provide a justification');
      return;
    }

    createSpecialRequest(
      {
        floor_id: selectedFloorId,
        locker_id: selectedLockerId || undefined,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: isPermanent ? undefined : endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
        justification: justification.trim(),
      },
      {
        onSuccess: () => {
          toast.success('Special request submitted successfully!', {
            description: 'You will be notified when your request is reviewed.',
          });
          navigate('/user/special-request');
        },
        onError: (error: Error) => {
          toast.error(error.message || 'Failed to submit special request', {
            description: 'Please try again later.',
          });
        },
      }
    );
  };

  return (
    <UserLayout>
      <div className="w-full">
        <main className="container max-w-3xl px-6 py-8 mx-auto -mt-8">
          <Button
            variant="link"
            onClick={() => navigate('/user/special-request')}
            className="mb-4 -ml-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Special Requests
          </Button>

          <div className="bg-white rounded-lg border border-grey-outline shadow-sm p-10">
            <div className="flex items-center gap-4 mb-2">
              <div className={'flex items-center justify-center rounded-lg bg-primary-foreground text-primary font-bold shrink-0 h-12 w-12 text-m'}>
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-dark-blue">Special Locker Request</h2>
                <p className="mt-1 text-sm text-grey">
                  Request a locker for an extended duration or permanent allocation.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pt-5">
              <div className="space-y-2" data-tour="floor-selector">
                <Label htmlFor="floor">
                  Floor <span className="text-red">*</span>
                </Label>
                <FloorDropdown
                  value={selectedFloorId}
                  onChange={setSelectedFloorId}
                  showAllOption={false}
                  className="w-full justify-between font-normal"
                  highlightSelected
                />
              </div>

              <div className="space-y-2" data-tour="date-picker">
                <DateRangePicker
                  startDate={startDate}
                  endDate={isPermanent ? undefined : endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  disableEndDate={isPermanent}
                  disableRules={true}
                />
                <div className="flex items-center space-x-2 mt-3" data-tour="permanent-checkbox">
                  <Checkbox
                    id="permanent"
                    checked={isPermanent}
                    onCheckedChange={(checked) => setIsPermanent(checked === true)}
                  />
                  <label
                    htmlFor="permanent"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Permanent Allocation
                  </label>
                </div>
                {isDateRangeTooShort && (
                  <p className="text-xs text-red mt-4">
                    Booking period is 3 days or less. Please use the{' '}
                    <Link to="/user/book" className="underline font-medium hover:text-red/80">
                      Book a Locker
                    </Link>{' '}
                    page instead.
                  </p>
                )}
              </div>

              <div className="space-y-2" data-tour="locker-selector">
                <Label htmlFor="locker">
                  Preferred Locker <span className="font-normal text-grey">(optional)</span>
                </Label>
                <Select value={selectedLockerId || 'none'} onValueChange={(value) => setSelectedLockerId(value === 'none' ? '' : value)}>
                  <SelectTrigger id="locker">
                    <SelectValue placeholder="No preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No preference</SelectItem>
                    {availableLockers
                      .filter((locker) => locker.is_available)
                      .map((locker) => (
                        <SelectItem key={locker.locker_id} value={locker.locker_id}>
                          {locker.locker_number}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2" data-tour="justification">
                <Label htmlFor="justification">
                  Justification <span className="text-red">*</span>
                </Label>
                <TextArea
                  id="justification"
                  placeholder="Explain why you need an extended or permanent locker allocation..."
                  value={justification}
                  onChange={(e: { target: { value: SetStateAction<string>; }; }) => setJustification(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-grey">
                  Provide a detailed reason for your special request
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => navigate('/user/special-request')}
                  disabled={isPending}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="highlight"
                  disabled={isPending || isDateRangeTooShort}
                  className="flex-1"
                  data-tour="submit-btn"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isPending ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </div>

        </main>
      </div>
      <PageTour steps={SPECIAL_REQUEST_STEPS} pageName="Special Request" />
    </UserLayout>
  );
};

export default NewSpecialRequest;

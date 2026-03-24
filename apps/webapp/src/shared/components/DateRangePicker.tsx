import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangePickerProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  disableWeekends?: boolean;
  disablePastDates?: boolean;
  maxDaysRange?: number;
  className?: string;
  labelClassName?: string;
  disableEndDate?: boolean;
}

export const DateRangePicker = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  disableWeekends = false,
  disablePastDates = false,
  maxDaysRange,
  className,
  labelClassName,
  disableEndDate = false,
}: DateRangePickerProps) => {
  const handleStartDateChange = (date: Date | undefined) => {
    onStartDateChange(date);
    if (date && endDate && date > endDate) {
      onEndDateChange(undefined);
    }
  };

  const isStartDateDisabled = (date: Date) => {
    if (disablePastDates) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) return true;
    }
    if (disableWeekends && (date.getDay() === 0 || date.getDay() === 6)) return true;
    return false;
  };

  const isEndDateDisabled = (date: Date) => {
    if (!startDate) {
      if (disablePastDates) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) return true;
      }
      if (disableWeekends && (date.getDay() === 0 || date.getDay() === 6)) return true;
      return false;
    }

    if (date < startDate) return true;

    if (maxDaysRange) {
      const maxEndDate = new Date(startDate);
      maxEndDate.setDate(startDate.getDate() + maxDaysRange);
      if (date > maxEndDate) return true;
    }

    if (disableWeekends && (date.getDay() === 0 || date.getDay() === 6)) return true;

    return false;
  };

  return (
    <div className={cn('grid grid-cols-2 gap-4', className)}>
      <div>
        <Label className={labelClassName}>Start Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !startDate && 'text-grey'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, 'MMM d, yyyy') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              selected={startDate}
              onSelect={handleStartDateChange}
              disabled={isStartDateDisabled}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label className={labelClassName}>End Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={disableEndDate}
              className={cn(
                'w-full justify-start text-left font-normal',
                !endDate && 'text-grey'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, 'MMM d, yyyy') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              selected={endDate}
              onSelect={onEndDateChange}
              disabled={isEndDateDisabled}
              defaultMonth={endDate || startDate}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export type CalendarProps = {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
  initialFocus?: boolean;
  defaultMonth?: Date;
};

function Calendar({
  selected,
  onSelect,
  disabled = () => false,
  className,
  defaultMonth,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(() => selected || defaultMonth || new Date());

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (!disabled(date) && onSelect) {
      onSelect(date);
    }
  };

  const isSelected = (day: number) => {
    if (!selected) return false;
    return (
      selected.getDate() === day &&
      selected.getMonth() === currentMonth.getMonth() &&
      selected.getFullYear() === currentMonth.getFullYear()
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
    );
  };

  const days = [];
  const totalDays = daysInMonth(currentMonth);
  const startDay = firstDayOfMonth(currentMonth);

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="w-9 h-9" />);
  }

  // Add cells for each day of the month
  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const isDisabled = disabled(date);
    const selected = isSelected(day);
    const today = isToday(day);

    days.push(
      <button
        key={day}
        type="button"
        onClick={() => handleDateClick(day)}
        disabled={isDisabled}
        className={cn(
          'w-9 h-9 p-0 font-normal text-sm inline-flex items-center justify-center rounded-md transition-colors',
          'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2',
          selected && 'bg-secondary text-white hover:bg-secondary/90 font-medium',
          !selected && today && 'bg-accent text-dark-blue font-medium',
          isDisabled && 'text-grey/30 cursor-not-allowed hover:bg-transparent opacity-50'
        )}
      >
        {day}
      </button>
    );
  }

  return (
    <div className={cn('p-4', className)}>
      <div className="space-y-3">
        {/* Header with month/year and navigation */}
        <div className="flex justify-center relative items-center mb-3">
          <button
            type="button"
            onClick={previousMonth}
            className="absolute left-1 h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded-md border border-grey-outline hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="text-sm font-semibold text-dark-blue">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </div>

          <button
            type="button"
            onClick={nextMonth}
            className="absolute right-1 h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded-md border border-grey-outline hover:bg-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Calendar grid */}
        <div>
          {/* Day names header */}
          <div className="grid grid-cols-7 mb-2">
            {dayNames.map((day) => (
              <div
                key={day}
                className="w-9 h-9 flex items-center justify-center text-xs font-medium text-grey uppercase"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0">
            {days}
          </div>
        </div>
      </div>
    </div>
  );
}

Calendar.displayName = 'Calendar';

export { Calendar };

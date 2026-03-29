import { cn } from '@/utils/cn';
import type { Locker, AvailableLocker } from '@/types/locker';
import { Lock, LockOpen } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getLockerDisplayNumber } from '@/utils/locker-parser';

interface LockerCellProps {
  locker: Locker | AvailableLocker;
  isSelected: boolean;
  onSelect: (locker: Locker | AvailableLocker) => void;
}

const LockerCell = ({ locker, isSelected, onSelect }: LockerCellProps) => {
  const isAvailableLocker = 'is_available' in locker;

  const isAvailable = isAvailableLocker
    ? (locker as AvailableLocker).is_available
    : locker.status === 'available';

  const isMaintenance = locker.status === 'maintenance';
  const isClickable = (isAvailable && !isMaintenance) || isSelected;
  const displayNumber = getLockerDisplayNumber(locker.locker_number);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          data-locker
          disabled={!isClickable}
          onClick={() => isClickable && onSelect(locker)}
          className={cn(
            'relative flex h-12 w-12 flex-col items-center justify-center rounded-lg border-2 transition-all duration-200 text-xs font-medium',
            isSelected &&
              'border-secondary-outline bg-secondary-foreground text-secondary scale-105 shadow-md cursor-pointer animate-pulse-soft',
            !isSelected && isAvailable && !isMaintenance &&
              'border-green-outline bg-green-foreground text-green hover:bg-green-foreground/50 hover:border-green hover:scale-105 cursor-pointer',
            !isAvailable && !isMaintenance &&
              'border-red-outline bg-red-foreground text-red cursor-not-allowed opacity-70',
            isMaintenance &&
              'border-orange-outline bg-orange-foreground text-orange cursor-not-allowed opacity-70'
          )}
        >
          {!isAvailable || isMaintenance ? (
            <Lock className="h-3.5 w-3.5" />
          ) : (
            <LockOpen className="h-3.5 w-3.5" />
          )}
          <span className="mt-0.5 text-[8px] leading-tight font-semibold">{displayNumber}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs border-primary">
        <p className="font-medium text-dark-blue">Locker {locker.locker_number}</p>
        <p className="text-primary">
          {locker.location ? `${locker.location} · ` : ''}
          <span className="capitalize">
            {isAvailableLocker && !isAvailable && locker.status === 'available'
              ? 'Booked'
              : locker.status}
          </span>
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

export default LockerCell;

import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DropdownItem {
  id: string;
  label: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  items: DropdownItem[];
  isLoading?: boolean;
  icon: React.ElementType;
  placeholder?: string;
  allOptionLabel?: string;
  showAllOption?: boolean;
  className?: string;
  highlightSelected?: boolean;
  getDisplayText?: (value: string, items: DropdownItem[]) => string;
}

const CustomDropdown = ({
  value,
  onChange,
  items,
  isLoading = false,
  icon: Icon,
  placeholder = 'Select option',
  allOptionLabel = 'All',
  showAllOption = true,
  className,
  highlightSelected = false,
  getDisplayText,
}: CustomDropdownProps) => {
  const defaultGetDisplayText = (val: string, itms: DropdownItem[]) => {
    if (isLoading) return 'Loading...';
    if (showAllOption && val === 'all') return allOptionLabel;
    const item = itms.find(i => i.id === val);
    return item?.label || placeholder;
  };

  const displayText = getDisplayText 
    ? getDisplayText(value, items)
    : defaultGetDisplayText(value, items);

  const isFullWidth = className?.includes('w-full');
  const hasValue = value && value !== '';

  const textColor = highlightSelected && hasValue && !isLoading ? 'text-dark-blue' : 'text-grey';

  const defaultClasses = `min-w-[150px] justify-between ${textColor}`;
  const buttonClassName = className ? `justify-between ${className}` : defaultClasses;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ${buttonClassName}`}
          disabled={isLoading}
        >
          <span className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {displayText}
          </span>
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className={`${isFullWidth ? 'w-[var(--radix-dropdown-menu-trigger-width)]' : 'min-w-[150px]'} max-h-[400px] overflow-y-auto`}
      >
        {showAllOption && (
          <DropdownMenuItem onClick={() => onChange('all')}>
            {allOptionLabel}
          </DropdownMenuItem>
        )}
        {items.map((item) => (
          <DropdownMenuItem key={item.id} onClick={() => onChange(item.id)}>
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CustomDropdown;

import { Building2 } from 'lucide-react';
import { useFloors } from '@/services/bookings';
import CustomDropdown from './CustomDropdown';

interface FloorDropdownProps {
  value: string;
  onChange: (floor: string) => void;
  showAllOption?: boolean;
  className?: string;
  highlightSelected?: boolean;
}

const FloorDropdown = ({ value, onChange, showAllOption = true, className, highlightSelected = false }: FloorDropdownProps) => {
  const { data: floorsData = [], isLoading: floorsLoading } = useFloors();

  const floorItems = floorsData.map(floor => ({
    id: floor.floor_id,
    label: `Floor ${floor.floor_number}`,
  }));

  const getDisplayText = (val: string) => {
    if (floorsLoading) return 'Loading...';
    if (showAllOption && val === 'all') return 'All Floors';
    const floor = floorsData.find(f => f.floor_id === val);
    return floor ? `Floor ${floor.floor_number}` : 'Select floor';
  };

  return (
    <CustomDropdown
      value={value}
      onChange={onChange}
      items={floorItems}
      isLoading={floorsLoading}
      icon={Building2}
      placeholder="Select floor"
      allOptionLabel="All Floors"
      showAllOption={showAllOption}
      className={className}
      highlightSelected={highlightSelected}
      getDisplayText={getDisplayText}
    />
  );
};

export default FloorDropdown;

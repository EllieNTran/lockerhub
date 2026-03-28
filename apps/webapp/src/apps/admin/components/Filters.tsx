import { CircleDashed } from 'lucide-react'
import SearchBar from '@/components/SearchBar'
import FloorDropdown from '@/shared/components/FloorDropdown'
import CustomDropdown from '@/shared/components/CustomDropdown'

interface FiltersProps {
  statusOptions: { value: string; label: string }[]
  placeholder: string
  searchQuery: string
  floorFilter: string
  statusFilter: string
  onSearchChange: (query: string) => void
  onFloorChange: (floor: string) => void
  onStatusChange: (status: string) => void
}

const Filters = ({ 
  statusOptions, 
  placeholder, 
  searchQuery,
  floorFilter,
  statusFilter,
  onSearchChange,
  onFloorChange, 
  onStatusChange 
}: FiltersProps) => {
  return (
        <div className='flex items-center justify-between gap-4'>
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder={placeholder}
            className='flex-1'
          />
          <div className='flex items-center gap-3'>
            <FloorDropdown value={floorFilter} onChange={onFloorChange} />

            <CustomDropdown
              value={statusFilter}
              onChange={onStatusChange}
              items={statusOptions.map(opt => ({ id: opt.value, label: opt.label }))}
              icon={CircleDashed}
              placeholder='Select status'
              allOptionLabel='All Statuses'
            />
          </div>
        </div>
  )
}

export default Filters

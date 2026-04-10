import { CircleDashed, KeyRound } from 'lucide-react'
import SearchBar from '@/components/SearchBar'
import FloorDropdown from '@/components/FloorDropdown'
import CustomDropdown from '@/components/CustomDropdown'

interface FiltersProps {
  statusOptions: { value: string; label: string }[]
  placeholder: string
  searchQuery: string
  floorFilter: string
  statusFilter: string
  keyStatusOptions?: { value: string; label: string }[]
  keyStatusFilter?: string
  statusAllOptionLabel?: string
  onSearchChange: (query: string) => void
  onFloorChange: (floor: string) => void
  onStatusChange: (status: string) => void
  onKeyStatusChange?: (status: string) => void
}

const Filters = ({
  statusOptions,
  placeholder,
  searchQuery,
  floorFilter,
  statusFilter,
  keyStatusOptions,
  keyStatusFilter,
  statusAllOptionLabel = 'All Statuses',
  onSearchChange,
  onFloorChange,
  onStatusChange,
  onKeyStatusChange
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
          allOptionLabel={statusAllOptionLabel}
        />

        {keyStatusOptions && keyStatusFilter !== undefined && onKeyStatusChange && (
          <CustomDropdown
            value={keyStatusFilter}
            onChange={onKeyStatusChange}
            items={keyStatusOptions.map(opt => ({ id: opt.value, label: opt.label }))}
            icon={KeyRound}
            placeholder='Select key status'
            allOptionLabel='All Key Statuses'
          />
        )}
      </div>
    </div>
  )
}

export default Filters

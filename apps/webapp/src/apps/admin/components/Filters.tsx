import { ChevronDown, Building2, CircleDashed } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SearchBar from '@/components/SearchBar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useFloors } from '@/services/bookings'

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
  const { data: floorsData = [], isLoading: floorsLoading } = useFloors()

  return (
        <div className='flex items-center justify-between gap-4'>
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder={placeholder}
            className='flex-1'
          />
          <div className='flex items-center gap-3'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant='outline' 
                  className='min-w-[150px] justify-between text-grey'
                  disabled={floorsLoading}
                >
                  <span className='flex items-center gap-2'>
                    <Building2 className='h-4 w-4' />
                    {floorsLoading 
                      ? 'Loading...' 
                      : floorFilter === 'all' 
                        ? 'All Floors' 
                        : `Floor ${floorFilter}`
                    }
                  </span>
                  <ChevronDown className='ml-2 h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='min-w-[150px]'>
                <DropdownMenuItem onClick={() => onFloorChange('all')}>
                  All Floors
                </DropdownMenuItem>
                {floorsData.map((floor) => (
                  <DropdownMenuItem key={floor.floor_id} onClick={() => onFloorChange(floor.floor_number)}>
                    Floor {floor.floor_number}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' className='min-w-[150px] justify-between text-grey'>
                  <span className='flex items-center gap-2'>
                    <CircleDashed className='h-4 w-4' />
                    {statusFilter === 'all' ? 'All Statuses' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  </span>
                  <ChevronDown className='ml-2 h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='min-w-[150px]'>
                {statusOptions.map(({ value, label }) => (
                  <DropdownMenuItem key={value} onClick={() => onStatusChange(value)}>
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
  )
}

export default Filters

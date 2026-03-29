import type { FloorLayout } from './types'
import { Corridor } from './components/Corridor'
import { Landmark } from './components/Landmark'
import { Zone } from './components/Zone'
import { getZoneFromLockerNumber } from '@/utils/locker-parser'
import type { Locker } from '@/types/locker'

interface FloorLayoutRendererProps {
  layout: FloorLayout
  lockers?: Locker[]
  selectedLockerId?: string | null
  onSelectLocker?: (locker: Locker) => void
  LockerComponent?: React.ComponentType<{
    locker: Locker
    isSelected: boolean
    onSelect: (locker: Locker) => void
  }>
  children?: React.ReactNode
}

export const FloorLayoutRenderer = ({
  layout,
  lockers = [],
  selectedLockerId = null,
  onSelectLocker = () => {},
  LockerComponent,
  children,
}: FloorLayoutRendererProps) => {
  const zoneMap = new Map(layout.zones.map(zone => [zone.id, zone]))
  const getLockerPosition = (locker: Locker) => {
    const zoneId = getZoneFromLockerNumber(locker.locker_number)
    const zone = zoneId ? zoneMap.get(zoneId) : null

    if (zone) {
      // Zone-relative coordinates: add zone offset to locker coords
      return {
        x: zone.x + (locker.x_coordinate || 0),
        y: zone.y + (locker.y_coordinate || 0),
      }
    }

    return {
      x: locker.x_coordinate || 0,
      y: locker.y_coordinate || 0,
    }
  }

  return (
    <div
      className="relative rounded-xl border-2 border-border bg-white overflow-hidden"
      style={{
        width: `${layout.dimensions.width}px`,
        height: `${layout.dimensions.height}px`,
      }}
    >
      {layout.corridors.map((corridor) => (
        <Corridor key={corridor.id} corridor={corridor} />
      ))}

      {layout.zones.map((zone) => (
        <Zone key={zone.id} zone={zone} />
      ))}

      {layout.landmarks.map((landmark) => (
        <Landmark key={landmark.id} landmark={landmark} />
      ))}

      {LockerComponent && lockers.map((locker) => {
        const position = getLockerPosition(locker)
        const isSelected = locker.locker_id === selectedLockerId
        return (
          <div
            key={locker.locker_id}
            className="absolute"
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
            }}
          >
            <LockerComponent locker={locker} isSelected={isSelected} onSelect={onSelectLocker} />
          </div>
        )
      })}
      {children}
    </div>
  )
}

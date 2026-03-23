import type { Locker, AvailableLocker } from "@/types/locker";
import { getZoneFromLockerNumber } from "@/utils/locker-parser";
import { useMemo } from "react";

interface ListViewProps {
  lockers: (Locker | AvailableLocker)[];
  selectedLockerId: string | null;
  onSelectLocker: (locker: Locker | AvailableLocker) => void;
}

const ListView = ({ lockers, selectedLockerId, onSelectLocker }: ListViewProps) => {
  const groupedLockers = useMemo(() => {
    const groups = new Map<string, Locker[]>();
    
    lockers.forEach(locker => {
      const zone = getZoneFromLockerNumber(locker.locker_number) || 'Unknown';
      if (!groups.has(zone)) {
        groups.set(zone, []);
      }
      groups.get(zone)!.push(locker);
    });

    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [lockers]);

  // Group zones into pairs for 2-column layout
  const zonePairs = useMemo(() => {
    const pairs: [typeof groupedLockers[0], typeof groupedLockers[0] | null][] = [];
    for (let i = 0; i < groupedLockers.length; i += 2) {
      pairs.push([groupedLockers[i], groupedLockers[i + 1] || null]);
    }
    return pairs;
  }, [groupedLockers]);

  const renderZone = (zone: string, zoneLockers: Locker[]) => (
    <div key={zone} className="space-y-2">
      <h4 className="text-sm font-semibold text-dark-blue px-2">
        Zone {zone}
        <span className="ml-2 text-xs font-normal text-grey">
          ({zoneLockers.length} locker{zoneLockers.length !== 1 ? 's' : ''})
        </span>
      </h4>

      <div className="space-y-2 pb-3">
        {zoneLockers.map((locker) => {
          const isSelected = locker.locker_id === selectedLockerId;
          const isAvailableLocker = 'is_available' in locker;
          const isAvailable = isAvailableLocker 
            ? (locker as AvailableLocker).is_available 
            : locker.status === 'available';
          
          let displayStatus: string = locker.status || 'available';
          if (isAvailableLocker && !isAvailable && locker.status === 'available') {
            displayStatus = 'booked';
          } else if (locker.status === 'reserved') {
            displayStatus = 'booked';
          }

          const getStatusColors = (status: string) => {
            switch (status) {
              case 'available':
                return 'bg-green-foreground text-green border-green-outline';
              case 'maintenance':
                return 'bg-orange-foreground text-orange border-orange-outline';
              default:
                return 'bg-red-foreground text-red border-red-outline';
            }
          };
          
          return (
            <div
              key={locker.locker_id}
              onClick={() => isAvailable && onSelectLocker(locker)}
              className={`
                p-3 rounded-lg border-2 transition-colors
                ${isAvailable ? 'cursor-pointer' : 'cursor-not-allowed'}
                ${isSelected
                  ? 'border-secondary-outline bg-secondary-foreground'
                  : 'border-grey-outline hover:border-secondary-outline/40 hover:bg-secondary-foreground/40 bg-grey-foreground/50'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${isSelected ? 'text-secondary' : 'text-dark-blue'}`}>{locker.locker_number}</p>
                  {locker.floor_number && (
                    <p className="text-xs text-grey">Floor {locker.floor_number}</p>
                  )}
                </div>
                <span
                  className={`
                    px-2 py-1 rounded-full text-xs font-medium capitalize border
                    ${getStatusColors(displayStatus)}
                  `}
                >
                  {displayStatus}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 p-3">
      {lockers.length === 0 ? (
        <p className="text-center text-grey py-8">No lockers found</p>
      ) : (
        zonePairs.map(([zone1, zone2], idx) => (
          <div key={idx} className="grid grid-cols-2 gap-6 items-start">
            <div>{renderZone(zone1[0], zone1[1])}</div>
            {zone2 && <div>{renderZone(zone2[0], zone2[1])}</div>}
          </div>
        ))
      )}
    </div>
  );
}

export default ListView

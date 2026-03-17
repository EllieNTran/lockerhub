import { useState, useEffect, useCallback, useRef } from 'react'
import { Save, RotateCcw } from 'lucide-react'
import AdminLayout from '../layout/AdminLayout'
import { Button } from '@/components/ui/button'
import ZoomControls from '@/shared/components/ZoomControls'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/sonner'
import { useAllLockers, useUpdateLockerCoordinates } from '@/services/admin'
import { FloorLayoutRenderer, getFloorLayout } from '@/shared/components/floor-layouts'
import type { Locker } from '@/types/locker'
import { getZoneFromLockerNumber, getFloorFromLockerNumber } from '@/shared/utils/locker-parser'
import { useFloors } from "@/services/bookings";
import { DraggableLocker } from '../components/DraggableLocker'
import Heading from '@/components/Heading'

const LOCKER_SIZE = 48
const LOCKER_SPACING = 8
const ZONE_LABEL_HEIGHT = 40
const SNAP_THRESHOLD = 12 // Pixels within which to snap to nearby lockers

const LockerConfiguration = () => {
  const [selectedFloor, setSelectedFloor] = useState<string>('')
  const [lockers, setLockers] = useState<Locker[]>([])
  const [draggingLocker, setDraggingLocker] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalLockers, setOriginalLockers] = useState<Locker[]>([])
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: floors = [], isLoading: floorsLoading } = useFloors()
  const { data: allLockers = [], isLoading: lockersLoading } = useAllLockers()
  
  const updateCoordinatesMutation = useUpdateLockerCoordinates()

  const layout = getFloorLayout(selectedFloor)

  useEffect(() => {
    if (floors.length > 0 && !selectedFloor) {
      setSelectedFloor(floors[0].floor_number)
    }
  }, [floors, selectedFloor])

  useEffect(() => {
    if (allLockers.length > 0) {
      setLockers(allLockers)
      setOriginalLockers(JSON.parse(JSON.stringify(allLockers)))
    }
  }, [allLockers])

  useEffect(() => {
    setPan({ x: 0, y: 0 })
    setScale(1)
  }, [selectedFloor])

  const normalizeFloor = (useCallback((floor: string) => {
    return floor.replace(/\s+East$/i, 'E').replace(/\s+/g, '').toUpperCase()
  }, []))

  const floorLockers = lockers.filter(l => {
    const floorFromNumber = getFloorFromLockerNumber(l.locker_number)
    if (!floorFromNumber) return false
    
    // Special case: Floor 2 has lockers named L2W- which should match floor "2"
    if (floorFromNumber === '2W' && selectedFloor === '2') {
      return true
    }

    return normalizeFloor(floorFromNumber) === normalizeFloor(selectedFloor)
  })

  const handleDragStart = useCallback((lockerId: string) => (e: React.DragEvent) => {
    setDraggingLocker(lockerId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('lockerId', lockerId)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    
    if (!containerRef.current || !layout) return

    const lockerId = e.dataTransfer.getData('lockerId')
    const locker = floorLockers.find(l => l.locker_id === lockerId)
    
    if (!locker) return

    const zoneId = getZoneFromLockerNumber(locker.locker_number)
    const zone = layout.zones.find(z => z.id === zoneId)
    
    if (!zone) {
      toast.error('Locker zone not found in layout')
      return
    }

    const rect = containerRef.current.getBoundingClientRect()
    
    // Calculate zone-relative coordinates
    const x = ((e.clientX - rect.left - rect.width / 2 - pan.x) / scale) + (layout.dimensions.width / 2)
    const y = ((e.clientY - rect.top - rect.height / 2 - pan.y) / scale) + (layout.dimensions.height / 2)
    const zoneRelativeX = Math.round(x - zone.x - 24)
    const zoneRelativeY = Math.round(y - zone.y - 24)

    // Find other lockers in same zone for snapping
    const sameZoneLockers = floorLockers.filter(l => 
      l.locker_id !== lockerId && 
      getZoneFromLockerNumber(l.locker_number) === zoneId && 
      l.x_coordinate !== null && 
      l.y_coordinate !== null
    )

    // Apply snap-to-grid
    let snappedX = zoneRelativeX
    let snappedY = zoneRelativeY

    for (const other of sameZoneLockers) {
      const otherX = other.x_coordinate || 0
      const otherY = other.y_coordinate || 0

      // Snap to position
      if (Math.abs(zoneRelativeX - otherX) <= SNAP_THRESHOLD) snappedX = otherX
      if (Math.abs(zoneRelativeY - otherY) <= SNAP_THRESHOLD) snappedY = otherY

      // Snap to edges (for rows/columns)
      const rightEdge = otherX + LOCKER_SIZE + LOCKER_SPACING
      const bottomEdge = otherY + LOCKER_SIZE + LOCKER_SPACING
      
      if (Math.abs(zoneRelativeX - rightEdge) <= SNAP_THRESHOLD) snappedX = rightEdge
      if (Math.abs(zoneRelativeX + LOCKER_SIZE + LOCKER_SPACING - otherX) <= SNAP_THRESHOLD) {
        snappedX = otherX - LOCKER_SIZE - LOCKER_SPACING
      }
      if (Math.abs(zoneRelativeY - bottomEdge) <= SNAP_THRESHOLD) snappedY = bottomEdge
      if (Math.abs(zoneRelativeY + LOCKER_SIZE + LOCKER_SPACING - otherY) <= SNAP_THRESHOLD) {
        snappedY = otherY - LOCKER_SIZE - LOCKER_SPACING
      }
    }
    
    // Clamp to zone bounds
    const clampedX = Math.max(LOCKER_SPACING, Math.min(snappedX, zone.width - LOCKER_SIZE - LOCKER_SPACING))
    const clampedY = Math.max(ZONE_LABEL_HEIGHT + LOCKER_SPACING, Math.min(snappedY, zone.height - LOCKER_SIZE - LOCKER_SPACING))

    setLockers(prev => prev.map(l => 
      l.locker_id === lockerId ? { ...l, x_coordinate: clampedX, y_coordinate: clampedY } : l
    ))
    
    setHasChanges(true)
    setDraggingLocker(null)
  }, [floorLockers, layout, scale, pan])

  const handleDragEnd = useCallback(() => {
    setDraggingLocker(null)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY
    const zoomSpeed = 0.001
    const newScale = Math.max(0.5, Math.min(3, scale - delta * zoomSpeed))
    setScale(newScale)
  }, [scale])

  const handleZoomIn = () => {
    setScale(prev => Math.min(3, prev + 0.2))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.2))
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start panning if not clicking on a locker (check for draggable attribute)
    const target = e.target as HTMLElement
    if (target.closest('[draggable="true"]')) return
    if (draggingLocker) return
    
    e.preventDefault()
    setIsPanning(true)
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }, [draggingLocker, pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return
    
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    })
  }, [isPanning, panStart])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleSave = async () => {
    try {
      const changedLockers = floorLockers.filter(locker => {
        const original = originalLockers.find(l => l.locker_id === locker.locker_id)
        return original && (
          original.x_coordinate !== locker.x_coordinate ||
          original.y_coordinate !== locker.y_coordinate
        )
      })

      if (changedLockers.length === 0) {
        toast.info('No changes to save')
        return
      }

      toast.promise(
        Promise.all(
          changedLockers.map(locker =>
            updateCoordinatesMutation.mutateAsync({
              lockerId: locker.locker_id,
              x_coordinate: locker.x_coordinate || 0,
              y_coordinate: locker.y_coordinate || 0
            })
          )
        ).then(() => {
          setOriginalLockers(JSON.parse(JSON.stringify(lockers)))
          setHasChanges(false)
        }),
        {
          loading: `Saving ${changedLockers.length} locker position${changedLockers.length > 1 ? 's' : ''}...`,
          success: `Successfully updated ${changedLockers.length} locker${changedLockers.length > 1 ? 's' : ''}!`,
          error: 'Failed to save locker positions',
        }
      )
    } catch (error) {
      console.error('Save error:', error)
    }
  }

  const handleReset = () => {
    setLockers(JSON.parse(JSON.stringify(originalLockers)))
    setHasChanges(false)
  }

  if (lockersLoading || floorsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-grey">Loading...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Heading
              title="Locker Configuration"
              description="Drag lockers to reposition them within their zones"
            />
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedFloor} onValueChange={setSelectedFloor}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select floor" />
              </SelectTrigger>
              <SelectContent>
                {floors.map((floor) => (
                  <SelectItem key={floor.floor_id} value={floor.floor_number}>
                    Floor {floor.floor_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ZoomControls
              scale={scale}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
            />
            <Button
              variant="outline"
              disabled={!hasChanges}
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              disabled={!hasChanges}
              onClick={handleSave}
              className="bg-secondary text-secondary-foreground"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-grey-outline bg-card p-6 shadow-card">
          <p className="text-sm text-dark-blue mb-4">
            Floor {selectedFloor}
            {' · '}
            <span className="text-grey">{floorLockers.length} Lockers</span>
            {hasChanges && (
              <span className="ml-2 text-amber-600 font-medium">
                • Unsaved changes
              </span>
            )}
          </p>

          <div
            ref={containerRef}
            className="relative overflow-hidden rounded-lg border-2 border-grey-outline bg-floor-grey select-none"
            style={{ height: 600, cursor: isPanning ? 'grabbing' : 'grab' }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {layout ? (
              <div
                className={`absolute left-1/2 top-1/2 ${!isPanning ? 'transition-transform duration-100' : ''}`}
                style={{
                  width: layout.dimensions.width,
                  height: layout.dimensions.height,
                  transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${scale})`,
                }}
              >
                <FloorLayoutRenderer
                  layout={layout}
                  lockers={floorLockers}
                  onSelectLocker={() => {}}
                  LockerComponent={() => null}
                >
                  {/* Render draggable lockers */}
                  {floorLockers.map((locker) => {
                    const zoneId = getZoneFromLockerNumber(locker.locker_number)
                    const zone = layout.zones.find(z => z.id === zoneId)
                    
                    if (!zone) return null

                    const absoluteX = zone.x + (locker.x_coordinate || 0)
                    const absoluteY = zone.y + (locker.y_coordinate || 0)

                    return (
                      <div
                        key={locker.locker_id}
                        style={{
                          position: 'absolute',
                          left: `${absoluteX}px`,
                          top: `${absoluteY}px`,
                        }}
                      >
                        <DraggableLocker
                          locker={locker}
                          scale={scale}
                          onDragStart={handleDragStart(locker.locker_id)}
                          onDragEnd={handleDragEnd}
                        />
                      </div>
                    )
                  })}
                </FloorLayoutRenderer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-grey">No layout configured for this floor</p>
              </div>
            )}
          </div>

          <div className="mt-4 text-xs text-grey">
            <p>Drag lockers to reposition them. Click and drag the canvas to pan. Use mouse wheel or zoom controls to zoom in/out. Changes are zone-relative.</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default LockerConfiguration

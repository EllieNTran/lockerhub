import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import type { Locker, AvailableLocker } from "@/types/locker";
import LockerCell from "./LockerCell";
import { FloorLayoutRenderer, getFloorLayout } from "./floor-layouts";

interface FloorPlanProps {
  lockers: (Locker | AvailableLocker)[];
  selectedLockerId: string | null;
  onSelectLocker: (locker: Locker | AvailableLocker) => void;
  floorNumber?: string;
  scale?: number;
  translate?: { x: number; y: number };
  onScaleChange?: (scale: number) => void;
  onTranslateChange?: (translate: { x: number; y: number }) => void;
}

const FloorPlan = ({ 
  lockers, 
  selectedLockerId, 
  onSelectLocker, 
  floorNumber,
  scale: externalScale,
  translate: externalTranslate,
  onScaleChange,
  onTranslateChange
}: FloorPlanProps) => {
  const [internalScale, setInternalScale] = useState(1);
  const [internalTranslate, setInternalTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const scale = externalScale ?? internalScale;
  const translate = externalTranslate ?? internalTranslate;
  const setScale = onScaleChange ?? setInternalScale;
  const setTranslate = onTranslateChange ?? setInternalTranslate;
  const dragStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Get floor layout configuration
  const layout = useMemo(() => {
    if (!floorNumber) return null;
    return getFloorLayout(floorNumber);
  }, [floorNumber]);

  // Calculate floor plan dimensions based on layout or locker coordinates
  const dimensions = useMemo(() => {
    if (layout) {
      return layout.dimensions;
    }
    // Fallback to calculating from locker coordinates
    const maxX = Math.max(...lockers.map(l => l.x_coordinate || 0), 500);
    const maxY = Math.max(...lockers.map(l => l.y_coordinate || 0), 400);
    return { width: maxX + 100, height: maxY + 100 };
  }, [lockers, layout]);

  // Attach wheel event listener with passive: false to prevent page scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.min(Math.max(scale + delta, 0.4), 3);
      setScale(newScale);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [scale, setScale]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button[data-locker]")) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    translateStart.current = { ...translate };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [translate]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setTranslate({
      x: translateStart.current.x + (e.clientX - dragStart.current.x),
      y: translateStart.current.y + (e.clientY - dragStart.current.y),
    });
  }, [isDragging, setTranslate]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-lg border-2 border-grey-outline bg-floor-grey cursor-grab active:cursor-grabbing"
      style={{ height: 520 }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
        style={{
          transform: `translate(calc(-50% + ${translate.x}px), calc(-50% + ${translate.y}px)) scale(${scale})`,
          width: dimensions.width,
          height: dimensions.height,
        }}
      >
        {layout ? (
          <FloorLayoutRenderer 
            layout={layout}
            lockers={lockers}
            selectedLockerId={selectedLockerId}
            onSelectLocker={onSelectLocker}
            LockerComponent={LockerCell}
          />
        ) : (
          /* Fallback: simple floor outline without layout */
          <div
            className="relative h-full w-full rounded-xl border-2 border-border bg-background/80 p-4"
            style={{
              width: dimensions.width,
              height: dimensions.height,
            }}
          >
            {lockers.map((locker) => {
              const isSelected = locker.locker_id === selectedLockerId;
              return (
                <div
                  key={locker.locker_id}
                  className="absolute"
                  style={{
                    left: `${locker.x_coordinate || 0}px`,
                    top: `${locker.y_coordinate || 0}px`,
                  }}
                >
                  <LockerCell locker={locker} isSelected={isSelected} onSelect={onSelectLocker} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FloorPlan;

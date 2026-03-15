import { useState, useEffect } from "react";
import type { Locker, AvailableLocker } from "@/types/locker";
import { RotateCcw, Map, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlidingToggle } from "@/components/ui/sliding-toggle";
import ZoomControls from "./ZoomControls";
import FloorPlan from "./FloorPlan";
import ListView from "./ListView";

interface SearchResultsProps {
  lockers: (Locker | AvailableLocker)[];
  onSelectLocker: (locker: Locker | AvailableLocker) => void;
  floorNumber?: string;
}

type ViewMode = "floor" | "list";

const STORAGE_KEY = "locker-view-mode";

const SearchResults = ({ lockers, onSelectLocker, floorNumber }: SearchResultsProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved === "floor" || saved === "list") ? saved : "floor";
  });
  const [selectedLockerId, setSelectedLockerId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, viewMode);
  }, [viewMode]);

  const handleSelectLocker = (locker: Locker | AvailableLocker) => {
    const isAvailableLocker = 'is_available' in locker;
    const isAvailable = isAvailableLocker 
      ? (locker as AvailableLocker).is_available 
      : locker.status === 'available';
    
    if (isAvailable) {
      setSelectedLockerId(locker.locker_id);
      onSelectLocker(locker);
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(3, prev + 0.2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.4, prev - 0.2));
  };

  const handleResetView = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  return (
    <div className="rounded-xl border border-grey-outline bg-white p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-dark-blue">Search Results</h3>
        <div className="flex items-center gap-2">

          {viewMode === "floor" && (
            <>
              <div className="flex items-center gap-4 text-[11px] text-grey mr-4">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full border-2 border-success bg-success/30" />
                  Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full border-2 border-error bg-error/30" />
                  Occupied
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full border-2 border-secondary bg-secondary/30" />
                  Selected
                </span>
              </div>
            
              <ZoomControls
                scale={scale}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                size="sm"
                height="2rem"
              />
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleResetView}>
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </>
          )}

          <div className="ml-2 h-8">
            <SlidingToggle
              options={[
                { value: "floor", label: "Floor", icon: <Map className="h-3.5 w-3.5" /> },
                { value: "list", label: "List", icon: <List className="h-3.5 w-3.5" /> },
              ]}
              value={viewMode}
              onChange={setViewMode}
            />
          </div>
        </div>
      </div>

      {viewMode === "floor" ? (
        <FloorPlan
          lockers={lockers}
          selectedLockerId={selectedLockerId}
          onSelectLocker={handleSelectLocker}
          floorNumber={floorNumber}
          scale={scale}
          translate={translate}
          onScaleChange={setScale}
          onTranslateChange={setTranslate}
        />
      ) : (
        <ListView 
          lockers={lockers} 
          selectedLockerId={selectedLockerId}
          onSelectLocker={handleSelectLocker} 
        />
      )}
    </div>
  );
};

export default SearchResults;

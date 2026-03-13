import { TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface FloorStat {
  name: string;
  total: number;
  occupied: number;
  pct: number;
}

interface LockerUtilisationProps {
  floorStats: FloorStat[];
  totalLockers: number;
}

const LockerUtilisation = ({ floorStats, totalLockers }: LockerUtilisationProps) => {
  return (
    <div className="rounded-xl border border-grey-outline bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-dark-blue flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Locker Utilisation by Floor
        </h3>
        <span className="text-xs text-grey">{totalLockers} total</span>
      </div>
      <div className="space-y-3">
        {floorStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <TrendingUp className="h-8 w-8 text-grey/40 mb-2" />
            <p className="text-sm text-grey">No floor data available</p>
          </div>
        ) : (
          floorStats.map((f) => (
            <div key={f.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-dark-blue">{f.name}</span>
                <span className="text-grey">
                  {f.occupied}/{f.total} &bull;{" "}
                  {f.pct}%
                </span>
              </div>
              <Progress
                value={f.pct}
                className="h-1.5 bg-secondary-foreground [&>div]:bg-secondary"
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LockerUtilisation;

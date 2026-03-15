import { Building2 } from "lucide-react";
import { getGreeting } from "@/shared/utils/get-greeting";

interface HeroBannerProps {
  subtitle: string;
  statLabel: string;
  statValue: string | number;
  location?: string;
}

const HeroBanner = ({ subtitle, statLabel, statValue, location = "Canary Wharf, London Office" }: HeroBannerProps) => {
  return (
    <div className="mb-8 rounded-2xl bg-gradient-to-br from-primary via-primary to-secondary px-8 py-10 text-white relative overflow-hidden shadow-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-secondary/20" />
      <div className="relative flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">{getGreeting()}</h2>
          <p className="mt-2 text-white/80 text-sm">
            {subtitle}
          </p>
          <div className="mt-4 flex items-center gap-2 text-white text-sm">
            <Building2 className="h-4 w-4" />
            <span>{location}</span>
          </div>
        </div>
        <div className="flex h-24 w-28 flex-col items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
          <span className="text-3xl font-bold">{statValue}</span>
          <span className="text-sm text-white/90">{statLabel}</span>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;

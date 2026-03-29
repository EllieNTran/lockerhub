import { ZoomIn, ZoomOut } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  showPercentage?: boolean;
  size?: 'sm' | 'md';
  height?: string;
}

interface ZoomButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  size: 'sm' | 'md';
}

const ZoomButton = ({ icon: Icon, onClick, size }: ZoomButtonProps) => {
  const isSmall = size === 'sm';

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`hover:bg-secondary hover:text-white ${isSmall ? 'h-7 w-7 p-0' : 'h-8 w-8 p-0'}`}
    >
      <Icon className={isSmall ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
    </Button>
  );
};

const ZoomControls = ({
  scale,
  onZoomIn,
  onZoomOut,
  showPercentage = true,
  size = 'md',
  height
}: ZoomControlsProps) => {
  return (
    <div
      className="flex items-center gap-1 border border-grey-outline rounded-lg p-1"
      style={height ? { height } : undefined}
    >
      <ZoomButton icon={ZoomOut} onClick={onZoomOut} size={size} />
      {showPercentage && (
        <span className={`font-medium min-w-[3rem] text-center ${size === 'sm' ? 'text-[11px]' : 'text-xs'}`}>
          {Math.round(scale * 100)}%
        </span>
      )}
      <ZoomButton icon={ZoomIn} onClick={onZoomIn} size={size} />
    </div>
  );
};

export default ZoomControls;

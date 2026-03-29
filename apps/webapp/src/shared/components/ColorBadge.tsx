import { Badge } from '@/components/ui/badge';

const colors = {
  green: 'bg-green-foreground text-green border-green-outline',
  blue: 'bg-primary-foreground text-primary border-primary-outline',
  brightBlue: 'bg-secondary-foreground text-secondary border-secondary-outline',
  red: 'bg-red-foreground text-red border-red-outline',
  purple: 'bg-purple-foreground text-purple border-purple-outline',
  pink: 'bg-pink-foreground text-pink border-pink-outline',
  grey: 'bg-light-grey text-grey border-grey-outline',
  orange: 'bg-orange-foreground text-orange border-orange-outline',
  dark: 'bg-white text-dark-blue/90 border-dark-blue/20',
  babyBlue: 'bg-baby-blue-foreground text-baby-blue border-baby-blue-outline',
} as const;

type StatusColor = keyof typeof colors;

interface ColorBadgeProps {
  color: StatusColor;
  status: string;
  icon?: React.ReactNode;
}

const ColorBadge = ({ color, status, icon }: ColorBadgeProps) => {

  return (
    <Badge
      variant="outline"
      className={colors[color]}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {status}
    </Badge>
  )
};

export default ColorBadge;

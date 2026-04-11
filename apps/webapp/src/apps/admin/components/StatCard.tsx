const colorMap = {
  green: 'bg-green-foreground text-green',
  blue: 'bg-primary-foreground text-primary',
  brightBlue: 'bg-secondary-foreground text-secondary',
  red: 'bg-red-foreground text-red',
  purple: 'bg-purple-foreground text-purple',
  pink: 'bg-pink-foreground text-pink',
  orange: 'bg-orange-foreground text-orange',
};

type color = keyof typeof colorMap;

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: color;
  onClick?: () => void;
}

const StatCard = ({ label, value, sub, icon: Icon, color, onClick }: StatCardProps) => (
  <div
    className={`rounded-xl border border-grey-outline bg-white p-5 shadow-sm flex items-start gap-4 ${
      onClick ? 'hover:border-primary' : ''
    }`}
    onClick={onClick}
  >
    <div className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-lg ${colorMap[color]}`}>
      <Icon className="h-7 w-7" />
    </div>
    <div className="min-w-0 flex flex-col gap-0.5">
      <p className="text-xs text-grey">{label}</p>
      <p className="text-2xl font-bold text-dark-blue leading-tight">{value}</p>
      {sub && <p className="text-xs text-grey">{sub}</p>}
    </div>
  </div>
);

export default StatCard;

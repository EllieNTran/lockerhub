import type { LucideIcon } from 'lucide-react';

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onClick: () => void;
  color?: string;
}

const QuickActionCard = ({ icon: Icon, title, subtitle, onClick, color = 'primary' }: QuickActionCardProps) => {
  return (
    <button
      onClick={onClick}
      className={'group flex items-center gap-4 rounded-xl border border-grey-outline bg-white p-5 transition-colors hover:border-primary shadow-sm text-left'}
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-${color}-foreground transition-colors group-hover:bg-${color}-foreground`}>
        <Icon className={`h-6 w-6 text-${color}`} />
      </div>
      <div>
        <p className="text-sm font-semibold text-dark-blue">{title}</p>
        <p className="text-xs text-grey">{subtitle}</p>
      </div>
    </button>
  );
};

export default QuickActionCard;

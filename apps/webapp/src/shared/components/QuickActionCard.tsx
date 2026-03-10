import type { LucideIcon } from "lucide-react";

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onClick: () => void;
}

const QuickActionCard = ({ icon: Icon, title, subtitle, onClick }: QuickActionCardProps) => {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-4 rounded-xl border border-grey-outline bg-card p-5 transition-colors hover:border-primary hover:shadow-md text-left"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-foreground transition-colors group-hover:bg-primary-foreground">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold text-dark-blue">{title}</p>
        <p className="text-xs text-grey">{subtitle}</p>
      </div>
    </button>
  );
};

export default QuickActionCard;

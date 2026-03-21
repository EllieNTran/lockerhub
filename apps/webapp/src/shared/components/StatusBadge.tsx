import { Badge } from "@/components/ui/badge";

const statusColors = {
  green: "bg-success-foreground text-success border-success-outline",
  blue: "bg-primary-foreground text-primary border-primary-outline",
  brightBlue: "bg-secondary-foreground text-secondary border-secondary-outline",
  red: "bg-error-foreground text-error border-error-outline",
  purple: "bg-purple-foreground text-purple border-purple-outline",
  pink: "bg-pink-foreground text-pink border-pink-outline",
  grey: "bg-light-grey text-grey border-grey-outline",
} as const;

type StatusColor = keyof typeof statusColors;

const StatusBadge = ({ color, status }: { color: StatusColor; status: string }) => {

  return (
    <Badge
      variant="outline"
      className={statusColors[color]}
    >
      {status}
    </Badge>
  )
};

export default StatusBadge;

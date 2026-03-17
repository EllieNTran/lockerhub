import { CircleCheck, Clock, KeyRound, TriangleAlert } from 'lucide-react'

const statusColors = {
  available: 'text-success',
  awaiting_handover: 'text-pending',
  with_employee: 'text-primary',
  awaiting_return: 'text-pending',
  lost: 'text-error',
  awaiting_replacement: 'text-pending',
} as const;

const statusIcons = {
  available: CircleCheck,
  awaiting_handover: Clock,
  with_employee: KeyRound,
  awaiting_return: Clock,
  lost: TriangleAlert,
  awaiting_replacement: Clock,
} as const;

type StatusColor = keyof typeof statusColors;

const statusLabels: Record<StatusColor, string> = {
  available: 'With FMT',
  awaiting_handover: 'Awaiting Handover',
  with_employee: 'With Employee',
  awaiting_return: 'Awaiting Return',
  lost: 'Lost',
  awaiting_replacement: 'Awaiting Replacement',
};

const KeyStatus = ({ status }: { status: StatusColor }) => {
  const Icon = statusIcons[status];

  return (
    <div className={`flex items-center gap-2 ${statusColors[status]}`}>
      <Icon className="h-4 w-4" />
      {statusLabels[status]}
    </div>
  )
};

export default KeyStatus;

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Clock, CalendarDays, MapPin, Hourglass, Loader, AlertTriangle, CircleCheckBig, X, CircleX } from "lucide-react";
import formatDuration from "@/utils/duration-format";
import StatusBadge from "@/components/StatusBadge";
import { formatTimeAgo } from "@/utils/date-format";
import type { Request } from "@/types/request";
import { Button } from "@/shared/components/ui/button";

interface SpecialRequestCardProps {
  specialRequest: Request,
  onCancel?: () => void,
}

const SpecialRequestCard = ({ specialRequest, onCancel }: SpecialRequestCardProps) => {
  const [statusColor, setStatusColor] = useState<"orange" | "green" | "red" | "grey">("grey");
  const getDuration = (startDate: string, endDate?: string | null) => {
    if (!endDate) {
      return "Permanent";
    }
    return formatDuration(startDate, endDate);
  }
  
  const getCardIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Loader className="h-6 w-6" />
      case "approved":
        return <CircleCheckBig className="h-6 w-6" />
      case "rejected":
        return <X className="h-6 w-6" />
      default:
        return <AlertTriangle className="h-6 w-6" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "orange"
      case "approved":
        return "green"
      case "rejected":
        return "red"
      default:
        return "grey"
    }
  }

  useEffect(() => {
    setStatusColor(getStatusColor(specialRequest.status));
  }, [specialRequest.status])

  return (
        <div className="flex flex-col gap-3 rounded-lg border border-grey-outline bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`flex items-center justify-center rounded-lg bg-${statusColor}-foreground text-${statusColor} font-bold shrink-0 h-12 w-12 text-m`}>
                {getCardIcon(specialRequest.status)}
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="text-md font-medium">
                    Request #{specialRequest.request_id}
                  </div>
                  <StatusBadge status={specialRequest.status} color={statusColor} />
                </div>
                <div className="flex items-center gap-4 text-xs text-grey">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {format(new Date(specialRequest.start_date), "MMM d")} —{" "}
                    {specialRequest.end_date 
                      ? format(new Date(specialRequest.end_date), "MMM d, yyyy")
                      : "Permanent"}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Floor {specialRequest.floor_number}
                  </span>
                  <span className="flex items-center gap-1">
                    <Hourglass className="h-3 w-3" />
                    {getDuration(specialRequest.start_date, specialRequest.end_date)}
                  </span>
                  {specialRequest.created_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Submitted {formatTimeAgo(specialRequest.created_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex">
              {specialRequest.status === "pending" && (
                <Button variant="outline" size="sm" textColor="text-red" className="text-xs" onClick={onCancel}>
                  <CircleX className="h-3 w-3" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
          <div className="bg-background p-3 rounded-lg text-sm">
            <span className="font-medium">Justification: </span>
            <span className="text-grey font-light">{specialRequest.justification}</span>
          </div>
        </div>
  )
}

export default SpecialRequestCard;

import { format } from "date-fns";
import { CalendarDays, MapPin } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import type { BookingStatus } from "@/types/booking";

interface BookingCardProps {
  booking: {
    booking_id: string;
    locker_number: string;
    floor_number: string;
    start_date: string;
    end_date: string | null;
    status: BookingStatus;
  };
}

const statusColors: Record<BookingStatus, "green" | "blue" | "brightBlue" | "red" | "purple" | "pink"> = {
  active: "green",
  upcoming: "brightBlue",
  completed: "blue",
  cancelled: "red",
  expired: "red",
};

const formatFloorNumber = (floor: string): string => {
  return floor.replace(/\s+(East|West)/i, (match) => match.trim()[0].toUpperCase());
};

const BookingCard = ({ booking }: BookingCardProps) => {
  const formattedFloor = formatFloorNumber(booking.floor_number);
  
  return (
    <div
      className="flex items-center justify-between rounded-lg border border-grey-outline bg-grey-foreground/50 p-3.5"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground text-primary font-bold text-m shrink-0">
          {formattedFloor}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{booking.locker_number}</span>
            <StatusBadge
              color={statusColors[booking.status]}
              status={booking.status}
            />
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-grey">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {format(new Date(booking.start_date), "MMM d")} —{" "}
              {booking.end_date 
                ? format(new Date(booking.end_date), "MMM d, yyyy")
                : "Permanent"}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Floor {booking.floor_number}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;

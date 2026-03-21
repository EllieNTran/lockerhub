import { useState } from "react";
import { BriefcaseBusiness, Mail, Network, Copy, Check } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import type { AdminBookingDetail } from "@/shared/types";
import { toast } from "@/shared/components/ui/sonner";

const StaffTooltip = ({ booking }: { booking: AdminBookingDetail }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(booking.email);
      setCopied(true);
      toast.success('Email copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy email');
    }
  };

  const renderDetail = (icon: React.ReactNode, label: string) => (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs font-light">{label || 'N/A'}</span>
    </div>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-pointer">{booking.employee_name}</span>
      </TooltipTrigger>
      <TooltipContent side="right" className="w-70 bg-primary text-white p-4 rounded-lg">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between items-center mb-3">
            <p className="font-semibold">{booking.employee_name}</p>
            <p className="text-xs">{booking.staff_number}</p>
          </div>
          <div className="flex flex-col gap-2">
            {renderDetail(<Network className="h-4 w-4" />, booking.capability_name || "N/A")}
            {renderDetail(<BriefcaseBusiness className="h-4 w-4" />, booking.department_name || "N/A")}
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="text-xs font-light">{booking.email}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyEmail}
                className="h-4 w-4 p-0 ml-auto"
              >
                {copied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export default StaffTooltip;

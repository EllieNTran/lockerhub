import { useEffect, useState, type SetStateAction } from 'react'
import { format } from 'date-fns'
import { Clock, CalendarDays, MapPin, Hourglass, Loader, AlertTriangle, CircleCheckBig, X, CircleX, CircleCheck } from 'lucide-react'
import formatDuration from '@/utils/duration-format'
import ColorBadge from '@/components/ColorBadge'
import { formatTimeAgo } from '@/utils/date-format'
import type { Request } from '@/types/request'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TextArea } from '@/components/ui/textarea'

type AdminSpecialRequestCardProps = {
  specialRequest: Request
  isAdmin: true
  onReview: (approved: boolean, reason?: string) => void
  onCancel?: never
}

type UserSpecialRequestCardProps = {
  specialRequest: Request
  isAdmin?: false
  onCancel: () => void
  onReview?: never
}

type SpecialRequestCardProps = AdminSpecialRequestCardProps | UserSpecialRequestCardProps

const SpecialRequestCard = ({ specialRequest, onCancel, onReview, isAdmin = false }: SpecialRequestCardProps) => {
  const [statusColor, setStatusColor] = useState<'orange' | 'green' | 'red' | 'grey'>('grey')
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const handleReject = () => {
    const trimmedReason = rejectionReason.trim()
    if (trimmedReason) {
      onReview?.(false, trimmedReason)
      setRejectDialogOpen(false)
      setRejectionReason('')
    }
  }

  const getDateRange = (startDate: string, endDate?: string | null) => {
    const formattedStartDate = format(new Date(startDate), 'MMM d, yyyy')
    if (!endDate) {
      return `Start: ${formattedStartDate}`
    }
    return `${formattedStartDate} — ${
      endDate ? format(new Date(endDate), 'MMM d, yyyy') : 'Permanent'
    }`
  }

  const getDuration = (startDate: string, endDate?: string | null) => {
    if (!endDate) {
      return 'Permanent'
    }
    return formatDuration(startDate, endDate)
  }

  const getCardIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Loader className='h-6 w-6' />
      case 'approved':
        return <CircleCheckBig className='h-6 w-6' />
      case 'rejected':
        return <X className='h-6 w-6' />
      default:
        return <AlertTriangle className='h-6 w-6' />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'orange'
      case 'approved':
        return 'green'
      case 'rejected':
        return 'red'
      default:
        return 'grey'
    }
  }

  useEffect(() => {
    setStatusColor(getStatusColor(specialRequest.status))
  }, [specialRequest.status])

  return (
    <>
        <div className='flex flex-col gap-3 rounded-lg border border-grey-outline bg-white p-5'>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex items-start gap-4'>
              <div className={`flex items-center justify-center rounded-lg bg-${statusColor}-foreground text-${statusColor} font-bold shrink-0 h-12 w-12 text-m`}>
                {getCardIcon(specialRequest.status)}
              </div>
              <div className='flex flex-col gap-1.5'>
                <div className='flex items-center gap-2'>
                  <div className='text-md font-medium'>
                    { isAdmin ? `${specialRequest.employee_name} #${specialRequest.request_id}` : `Request #${specialRequest.request_id}`}
                  </div>
                  <ColorBadge status={specialRequest.status} color={statusColor} />
                </div>
                <div className='flex items-center gap-4 text-xs text-grey'>
                  <span className='flex items-center gap-1'>
                    <CalendarDays className='h-3 w-3' />
                    {getDateRange(specialRequest.start_date, specialRequest.end_date)}
                  </span>
                  <span className='flex items-center gap-1'>
                    <MapPin className='h-3 w-3' />
                    Floor {specialRequest.floor_number}
                  </span>
                  <span className='flex items-center gap-1'>
                    <Hourglass className='h-3 w-3' />
                    {getDuration(specialRequest.start_date, specialRequest.end_date)}
                  </span>
                  {specialRequest.created_at && (
                    <span className='flex items-center gap-1'>
                      <Clock className='h-3 w-3' />
                      Submitted {formatTimeAgo(specialRequest.created_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className='flex'>
              {specialRequest.status === 'pending' && isAdmin && (
                <div className='flex gap-3'>
                  <Button variant='outline' size='sm' textColor='text-green' className='text-xs' onClick={() => onReview?.(true)}>
                    <CircleCheck className='h-3 w-3' />
                    Approve
                  </Button>
                  <Button variant='outline' size='sm' textColor='text-red' onClick={() => setRejectDialogOpen(true)} className='text-xs'>
                    <CircleX className='h-3 w-3' />
                    Reject
                  </Button>
                </div>
              )}

              {['pending', 'approved'].includes(specialRequest.status) && !isAdmin && (
                <Button variant='outline' size='sm' textColor='text-red' className='text-xs' onClick={onCancel}>
                  <CircleX className='h-3 w-3' />
                  Cancel
                </Button>
              )}

              {specialRequest.status === 'active' && isAdmin && (
                <Button variant='outline' className='text-xs'>
                  End Booking
                </Button>
              )}
            </div>
          </div>

          <div className='bg-background p-3 rounded-lg text-sm'>
            <span className='font-medium text-dark-blue/80'>Justification: </span>
            <span className='text-grey font-light'>{specialRequest.justification}</span>
          </div>

          {specialRequest.reason && (
            <div className='bg-red-foreground/40 p-3 rounded-lg text-sm'>
              <span className='font-medium text-dark-blue/80'>Rejection Reason: </span>
              <span className='text-grey font-light'>{specialRequest.reason}</span>
            </div>
          )}
        </div>

        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Request #{specialRequest.request_id}</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this special request. This will be visible to the user.
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-2'>
              <TextArea
                placeholder='Enter rejection reason...'
                value={rejectionReason}
                onChange={(e: { target: { value: SetStateAction<string> } }) => setRejectionReason(e.target.value)}
                className='min-h-[100px]'
              />
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => {
                setRejectDialogOpen(false)
                setRejectionReason('')
              }}>
                Cancel
              </Button>
              <Button
                variant='destructive'
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
              >
                Reject Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </>
  )
}

export default SpecialRequestCard

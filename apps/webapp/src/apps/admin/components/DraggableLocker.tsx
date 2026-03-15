import { useRef } from 'react'
import type { Locker } from '@/types/locker'

interface DraggableLockerProps {
  locker: Locker
  scale: number
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
}

export const DraggableLocker = ({ 
  locker, 
  scale,
  onDragStart,
  onDragEnd,
}: DraggableLockerProps) => {
  const lockerRef = useRef<HTMLDivElement>(null)

  const handleDragStart = (e: React.DragEvent) => {
    if (lockerRef.current) {
      const scaledSize = 48 * scale
      const dragImage = lockerRef.current.cloneNode(true) as HTMLElement
      Object.assign(dragImage.style, {
        position: 'absolute',
        top: '-9999px',
        width: `${scaledSize}px`,
        height: `${scaledSize}px`,
        transform: 'none'
      })
      document.body.appendChild(dragImage)
      
      e.dataTransfer.setDragImage(dragImage, scaledSize / 2, scaledSize / 2)

      setTimeout(() => document.body.removeChild(dragImage), 0)
    }
    onDragStart(e)
  }

  return (
    <div
      ref={lockerRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className={'absolute cursor-move rounded-lg flex items-center justify-center border-2 border-secondary-outline bg-secondary-foreground text-secondary'}
      style={{
        width: '48px',
        height: '48px',
      }}
    >
      <span className="text-xs font-bold">
        {locker.locker_number.split('-').pop()}
      </span>
    </div>
  )
}

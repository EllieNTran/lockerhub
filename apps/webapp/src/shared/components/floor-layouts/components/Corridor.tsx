import type { Corridor as CorridorType } from '../types'

interface CorridorProps {
  corridor: CorridorType
}

export const Corridor = ({ corridor }: CorridorProps) => {
  const borderClass = corridor.orientation === 'vertical'
    ? 'border-x'
    : 'border-y'

  return (
    <div
      className={`absolute bg-background border-dashed border-grey-outline ${borderClass}`}
      style={{
        left: `${corridor.x}px`,
        top: `${corridor.y}px`,
        width: `${corridor.width}px`,
        height: `${corridor.height}px`,
      }}
    >
      {corridor.label && (
        <div className="flex items-center justify-center h-full">
          <span className="text-[10px] font-medium text-grey uppercase tracking-widest">
            {corridor.label}
          </span>
        </div>
      )}
    </div>
  )
}

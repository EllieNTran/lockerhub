import type { Zone as ZoneType } from '../types'

interface ZoneProps {
  zone: ZoneType
}

export const Zone = ({ zone }: ZoneProps) => {
  return (
    <div
      className="absolute rounded-xl border-2 border-dashed border-grey-outline bg-background"
      style={{ 
        left: `${zone.x}px`,
        top: `${zone.y}px`,
        width: `${zone.width}px`,
        height: `${zone.height}px`,
      }}
    >
      <div
        className="absolute flex items-center justify-center pointer-events-none"
        style={{
          left: 0,
          top: '10px',
          width: `${zone.width}px`,
          height: '20px',
        }}
      >
        <span className="rounded-full bg-white border border-grey-outline px-3 py-0.5 text-[9px] font-semibold text-grey uppercase tracking-widest">
          ZONE {zone.id}
        </span>
      </div>
    </div>
  )
}

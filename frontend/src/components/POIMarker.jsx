import { useState } from 'react'
import { Html } from '@react-three/drei'

export function POIMarker({ position, title, onClick, selected, index }) {
  const [hovered, setHovered] = useState(false)
  const showLabel = selected || hovered

  const color = selected ? '#ef5350' : hovered ? '#81d4fa' : '#4fc3f7'

  return (
    <group position={[position.x, position.y + 0.05, position.z]}>
      <Html distanceFactor={14} center>
        <div
          onClick={(e) => { e.stopPropagation(); onClick() }}
          onMouseEnter={() => { setHovered(true); document.body.style.cursor = 'pointer' }}
          onMouseLeave={() => { setHovered(false); document.body.style.cursor = 'default' }}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 700,
            color: '#fff',
            background: selected ? 'rgba(239,83,80,0.15)' : hovered ? 'rgba(79,195,247,0.12)' : 'rgba(10,10,16,0.35)',
            border: `2px solid ${color}`,
            boxShadow: hovered || selected ? `0 0 10px ${color}66` : 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title={title || 'POI'}
        >
          {index}
        </div>
      </Html>

      {/* Label tooltip */}
      {showLabel && (
        <Html distanceFactor={14} center style={{ pointerEvents: 'none', userSelect: 'none', transition: 'opacity 0.2s' }}>
          <div style={{
            background: 'rgba(15, 15, 20, 0.95)',
            color: '#e0e0e0',
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            transform: 'translate(-50%, -160%)',
            border: `1px solid ${color}`,
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            letterSpacing: '0.3px',
          }}>
            {title || 'POI'}
          </div>
        </Html>
      )}
    </group>
  )
}

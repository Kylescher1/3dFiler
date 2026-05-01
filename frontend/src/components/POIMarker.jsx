import { useState } from 'react'
import { Html } from '@react-three/drei'

export function POIMarker({ position, title, onClick, selected, index }) {
  const [hovered, setHovered] = useState(false)
  const showLabel = selected || hovered

  const color = selected ? '#b91c1c' : hovered ? '#dc2626' : '#b91c1c'
  const pulse = selected ? '0 0 0 0 rgba(185,28,28,0.55)' : '0 0 0 0 rgba(185,28,28,0.25)'

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
            color: '#111',
            background: selected ? 'rgba(185,28,28,0.15)' : hovered ? 'rgba(185,28,28,0.12)' : 'rgba(240,240,242,0.6)',
            border: `2px solid ${color}`,
            boxShadow: hovered || selected ? `0 0 14px ${color}88` : 'none',
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
            background: 'rgba(255, 255, 255, 0.98)',
            color: '#333333',
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            transform: 'translate(-50%, -160%)',
            border: `1px solid ${color}`,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            letterSpacing: '0.3px',
          }}>
            {title || 'POI'}
          </div>
        </Html>
      )}
      <Html>
        <style>{`@keyframes poiPulse {0% { box-shadow:${pulse}; } 70% { box-shadow:0 0 0 12px rgba(185,28,28,0); } 100% { box-shadow:0 0 0 0 rgba(185,28,28,0);} }`}</style>
      </Html>
    </group>
  )
}

import { useState, useRef } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

export function POIMarker({ position, title, onClick, selected, index, modelRef }) {
  const [hovered, setHovered] = useState(false)
  const groupRef = useRef()
  const markerRef = useRef()
  const refDist = useRef(7)

  const showLabel = selected || hovered
  const color = selected ? '#b91c1c' : hovered ? '#dc2626' : '#b91c1c'

  useFrame(({ camera }) => {
    if (groupRef.current && markerRef.current) {
      if (modelRef?.current && refDist.current === 7) {
        const box = new THREE.Box3().setFromObject(modelRef.current)
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        refDist.current = Math.max(maxDim * 1.5, 2)
      }
      const dist = camera.position.distanceTo(groupRef.current.position)
      const s = Math.max(0.6, Math.min(2.0, dist / refDist.current))
      markerRef.current.style.transform = `scale(${s})`
    }
  })

  return (
    <group ref={groupRef} position={[position.x, position.y + 0.05, position.z]}>
      <Html center>
        <div
          ref={markerRef}
          onClick={(e) => { e.stopPropagation(); onClick() }}
          onMouseEnter={() => { setHovered(true); document.body.style.cursor = 'pointer' }}
          onMouseLeave={() => { setHovered(false); document.body.style.cursor = 'default' }}
          style={{
            transformOrigin: 'center center',
            transition: 'transform 0.08s linear',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <div
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
            }}
            title={title || 'POI'}
          >
            {index}
          </div>
          {showLabel && (
            <div style={{
              position: 'absolute',
              bottom: 'calc(100% + 6px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(255, 255, 255, 0.98)',
              color: '#333333',
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              border: `1px solid ${color}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              letterSpacing: '0.3px',
              pointerEvents: 'none',
            }}>
              {title || 'POI'}
            </div>
          )}
        </div>
      </Html>
    </group>
  )
}

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

export function POIMarker({ position, title, onClick, selected }) {
  const groupRef = useRef()
  const [hovered, setHovered] = useState(false)
  const showLabel = selected || hovered

  const color = selected ? '#ef5350' : hovered ? '#81d4fa' : '#4fc3f7'

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const y = position.y + Math.sin(clock.getElapsedTime() * 1.2) * 0.04 + 0.12
      groupRef.current.position.set(position.x, y, position.z)
    }
  })

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y + 0.12, position.z]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
    >
      {/* Outer ring — static, subtle */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, 0.12, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* Core dot */}
      <mesh onClick={(e) => { e.stopPropagation(); onClick() }}>
        <sphereGeometry args={[0.055, 20, 20]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.35}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* Label tooltip */}
      {showLabel && (
        <Html distanceFactor={12} center style={{ pointerEvents: 'none', userSelect: 'none', transition: 'opacity 0.2s' }}>
          <div style={{
            background: 'rgba(20, 20, 25, 0.92)',
            color: '#e0e0e0',
            padding: '3px 10px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            transform: 'translate(-50%, -155%)',
            border: `1px solid ${color}`,
            boxShadow: `0 2px 8px rgba(0,0,0,0.4)`,
            letterSpacing: '0.3px',
          }}>
            {title || 'POI'}
          </div>
        </Html>
      )}
    </group>
  )
}

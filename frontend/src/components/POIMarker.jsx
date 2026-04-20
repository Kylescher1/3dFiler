import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

export function POIMarker({ position, title, onClick, selected }) {
  const groupRef = useRef()
  const ringRef = useRef()

  const color = selected ? '#ef5350' : '#4fc3f7'

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const y = position.y + Math.sin(clock.getElapsedTime() * 2.5) * 0.08 + 0.15
      groupRef.current.position.set(position.x, y, position.z)
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = clock.getElapsedTime()
    }
  })

  return (
    <group ref={groupRef} position={[position.x, position.y + 0.15, position.z]}>
      {/* Outer ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.12, 0.16, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Core sphere */}
      <mesh onClick={(e) => { e.stopPropagation(); onClick() }}>
        <sphereGeometry args={[0.08, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>

      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>

      {/* Label tag */}
      <Html distanceFactor={10} center style={{ pointerEvents: 'none', userSelect: 'none' }}>
        <div style={{
          background: selected ? 'rgba(239,83,80,0.9)' : 'rgba(79,195,247,0.9)',
          color: '#000',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          transform: 'translate(-50%, -140%)',
          boxShadow: `0 0 8px ${color}`,
        }}>
          {title || 'POI'}
        </div>
      </Html>
    </group>
  )
}

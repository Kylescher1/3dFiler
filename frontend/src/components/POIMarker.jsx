import { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

export function POIMarker({ position, title, onClick, selected, index }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)
  const { camera } = useThree()
  const showLabel = selected || hovered

  const color = selected ? '#ef5350' : hovered ? '#81d4fa' : '#4fc3f7'

  useFrame(() => {
    if (meshRef.current) {
      const dist = camera.position.distanceTo(
        new THREE.Vector3(position.x, position.y, position.z)
      )
      // Scale between 0.4x and 2.2x based on distance
      const scale = Math.max(0.4, Math.min(2.2, dist / 5))
      meshRef.current.scale.setScalar(scale)
    }
  })

  return (
    <group position={[position.x, position.y + 0.05, position.z]}>
      {/* Pin stem */}
      <mesh position={[0, -0.025, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.05, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick() }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'default'
        }}
      >
        <sphereGeometry args={[0.08, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 0.6 : 0.35}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>

      {/* Numeric index badge */}
      {index && (
        <Html distanceFactor={14} center style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div style={{
            background: color,
            color: '#0a0a0a',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'translate(14px, -14px)',
            boxShadow: '0 1px 6px rgba(0,0,0,0.5)',
          }}>
            {index}
          </div>
        </Html>
      )}

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

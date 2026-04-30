import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'

// ───────────────────────────────────────────
// Central 3D Model Hub — wireframe polyhedron representing "the model"
// ───────────────────────────────────────────
function ModelHub() {
  const groupRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    groupRef.current.rotation.y = t * 0.12
    groupRef.current.rotation.x = Math.sin(t * 0.08) * 0.08
    groupRef.current.rotation.z = Math.cos(t * 0.06) * 0.04
  })

  return (
    <group ref={groupRef}>
      {/* Outer wireframe shell */}
      <mesh>
        <icosahedronGeometry args={[2.2, 1]} />
        <meshBasicMaterial color="#00f5d4" transparent opacity={0.08} wireframe />
      </mesh>
      {/* Secondary wireframe layer */}
      <mesh>
        <dodecahedronGeometry args={[2.0, 0]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.06} wireframe />
      </mesh>
      {/* Inner core glow */}
      <mesh>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshBasicMaterial color="#00f5d4" transparent opacity={0.15} />
      </mesh>
      {/* Core bright center */}
      <mesh>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>
      {/* Rotating inner ring */}
      <RingRings />
    </group>
  )
}

function RingRings() {
  const ref1 = useRef()
  const ref2 = useRef()
  const ref3 = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    ref1.current.rotation.x = t * 0.2
    ref1.current.rotation.y = t * 0.15
    ref2.current.rotation.x = -t * 0.25
    ref2.current.rotation.z = t * 0.1
    ref3.current.rotation.y = -t * 0.18
    ref3.current.rotation.z = -t * 0.12
  })

  return (
    <>
      <group ref={ref1}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.8, 0.012, 8, 100]} />
          <meshBasicMaterial color="#00f5d4" transparent opacity={0.35} />
        </mesh>
      </group>
      <group ref={ref2}>
        <mesh rotation={[0, Math.PI / 3, Math.PI / 4]}>
          <torusGeometry args={[3.2, 0.008, 8, 100]} />
          <meshBasicMaterial color="#8b5cf6" transparent opacity={0.25} />
        </mesh>
      </group>
      <group ref={ref3}>
        <mesh rotation={[Math.PI / 5, 0, Math.PI / 6]}>
          <torusGeometry args={[3.6, 0.006, 8, 100]} />
          <meshBasicMaterial color="#00b8d4" transparent opacity={0.2} />
        </mesh>
      </group>
    </>
  )
}

// ───────────────────────────────────────────
// POI Satellites — glowing markers orbiting the model
// ───────────────────────────────────────────
const POI_SATELLITES = [
  { radius: 4.0, speed: 0.35, yOffset: 1.2, phase: 0, color: '#00f5d4', size: 0.12 },
  { radius: 4.5, speed: 0.28, yOffset: -0.8, phase: 1.0, color: '#8b5cf6', size: 0.10 },
  { radius: 5.2, speed: 0.22, yOffset: 1.8, phase: 2.5, color: '#00b8d4', size: 0.14 },
  { radius: 3.6, speed: 0.40, yOffset: -1.5, phase: 3.8, color: '#00f5d4', size: 0.09 },
  { radius: 5.8, speed: 0.18, yOffset: 0.4, phase: 5.2, color: '#8b5cf6', size: 0.11 },
  { radius: 4.2, speed: 0.32, yOffset: -2.0, phase: 1.8, color: '#00b8d4', size: 0.13 },
  { radius: 6.2, speed: 0.15, yOffset: 2.2, phase: 4.5, color: '#00f5d4', size: 0.08 },
  { radius: 3.9, speed: 0.38, yOffset: 0.0, phase: 6.1, color: '#8b5cf6', size: 0.10 },
]

function POISatellites() {
  const groupRef = useRef()
  const lineRefs = useRef([])

  const lineGeometries = useMemo(() => {
    return POI_SATELLITES.map(() => new THREE.BufferGeometry())
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const center = new THREE.Vector3(0, 0, 0)

    POI_SATELLITES.forEach((poi, i) => {
      const angle = t * poi.speed + poi.phase
      const x = Math.cos(angle) * poi.radius
      const z = Math.sin(angle) * poi.radius
      const y = poi.yOffset + Math.sin(t * 0.5 + poi.phase) * 0.3

      const satellite = groupRef.current.children[i]
      if (satellite) {
        satellite.position.set(x, y, z)
        satellite.lookAt(center)
      }

      // Update connection line
      const line = lineRefs.current[i]
      if (line) {
        const positions = new Float32Array([0, 0, 0, x * 0.55, y * 0.55, z * 0.55])
        line.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        line.geometry.attributes.position.needsUpdate = true
      }
    })
  })

  return (
    <>
      {/* Connection lines from center to each POI */}
      {POI_SATELLITES.map((poi, i) => (
        <line
          key={`line-${i}`}
          ref={(el) => { lineRefs.current[i] = el }}
        >
          <bufferGeometry ref={(el) => { if (el) lineGeometries[i] = el }} />
          <lineBasicMaterial color={poi.color} transparent opacity={0.25} />
        </line>
      ))}

      {/* Satellite markers */}
      <group ref={groupRef}>
        {POI_SATELLITES.map((poi, i) => (
          <group key={i}>
            {/* Glow halo */}
            <mesh>
              <sphereGeometry args={[poi.size * 2.5, 16, 16]} />
              <meshBasicMaterial color={poi.color} transparent opacity={0.12} />
            </mesh>
            {/* Core marker */}
            <mesh>
              <sphereGeometry args={[poi.size, 16, 16]} />
              <meshBasicMaterial color={poi.color} transparent opacity={0.9} />
            </mesh>
            {/* Ring halo */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[poi.size * 2, poi.size * 2.8, 32]} />
              <meshBasicMaterial color={poi.color} transparent opacity={0.2} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}
      </group>
    </>
  )
}

// ───────────────────────────────────────────
// Floating Wiki Cards — holographic data panels
// ───────────────────────────────────────────
const WIKI_CARDS = [
  { pos: [5.5, 2.5, -2], rot: [0, -0.4, 0.05], size: [1.4, 1.0], speed: 0.2, phase: 0, color: '#00f5d4' },
  { pos: [-5.0, -1.8, 1], rot: [0, 0.5, -0.03], size: [1.2, 0.9], speed: 0.15, phase: 2, color: '#8b5cf6' },
  { pos: [-4.5, 3.2, -3], rot: [0, 0.3, 0.08], size: [1.0, 1.2], speed: 0.25, phase: 4, color: '#00b8d4' },
  { pos: [4.0, -3.0, 2], rot: [0, -0.6, -0.05], size: [1.3, 0.8], speed: 0.18, phase: 1.5, color: '#00f5d4' },
]

function WikiCards() {
  const groupRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    groupRef.current.children.forEach((child, i) => {
      const card = WIKI_CARDS[i]
      child.position.y = card.pos[1] + Math.sin(t * card.speed + card.phase) * 0.25
      child.rotation.z = card.rot[2] + Math.sin(t * 0.3 + card.phase) * 0.02
    })
  })

  return (
    <group ref={groupRef}>
      {WIKI_CARDS.map((card, i) => (
        <group key={i} position={card.pos} rotation={card.rot}>
          {/* Card body */}
          <mesh>
            <planeGeometry args={card.size} />
            <meshBasicMaterial color={card.color} transparent opacity={0.06} side={THREE.DoubleSide} />
          </mesh>
          {/* Card border */}
          <mesh scale={[1.01, 1.01, 1]}>
            <planeGeometry args={card.size} />
            <meshBasicMaterial color={card.color} transparent opacity={0.2} side={THREE.DoubleSide} wireframe />
          </mesh>
          {/* Inner line pattern — horizontal lines */}
          {Array.from({ length: 5 }).map((_, j) => (
            <mesh key={j} position={[0, -card.size[1] / 2 + (j + 1) * (card.size[1] / 6), 0.001]}>
              <planeGeometry args={[card.size[0] * 0.7, 0.008]} />
              <meshBasicMaterial color={card.color} transparent opacity={0.15} side={THREE.DoubleSide} />
            </mesh>
          ))}
          {/* Corner accents */}
          <CornerAccent x={-card.size[0] / 2} y={card.size[1] / 2} color={card.color} />
          <CornerAccent x={card.size[0] / 2} y={card.size[1] / 2} color={card.color} rotate />
          <CornerAccent x={-card.size[0] / 2} y={-card.size[1] / 2} color={card.color} rotate />
          <CornerAccent x={card.size[0] / 2} y={-card.size[1] / 2} color={card.color} />
        </group>
      ))}
    </group>
  )
}

function CornerAccent({ x, y, color, rotate = false }) {
  return (
    <group position={[x, y, 0.002]} rotation={[0, 0, rotate ? Math.PI : 0]}>
      <mesh position={[0.08, 0, 0]}>
        <planeGeometry args={[0.16, 0.012]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.08, 0]}>
        <planeGeometry args={[0.012, 0.16]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ───────────────────────────────────────────
// Grid Floor — subtle holographic ground plane
// ───────────────────────────────────────────
function GridFloor() {
  const gridRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    // Subtle pulse of grid opacity
    const mat = gridRef.current.material
    mat.opacity = 0.04 + Math.sin(t * 0.5) * 0.015
  })

  return (
    <mesh ref={gridRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
      <planeGeometry args={[40, 40]} />
      <meshBasicMaterial color="#00f5d4" transparent opacity={0.04} />
    </mesh>
  )
}

// ───────────────────────────────────────────
// Ambient particles — slow drifting data motes
// ───────────────────────────────────────────
function DataMotes() {
  const ref = useRef()
  const count = 120

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 24
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16
      pos[i * 3 + 2] = (Math.random() - 0.5) * 16
    }
    return pos
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const pos = ref.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += Math.sin(t * 0.2 + i) * 0.002
      // Wrap around
      if (pos[i * 3 + 1] > 8) pos[i * 3 + 1] = -8
      if (pos[i * 3 + 1] < -8) pos[i * 3 + 1] = 8
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#00f5d4" transparent opacity={0.5} sizeAttenuation />
    </points>
  )
}

// ───────────────────────────────────────────
// Scene Lighting
// ───────────────────────────────────────────
function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.15} color="#aaccff" />
      <pointLight position={[6, 4, 4]} color="#00f5d4" intensity={1.2} distance={20} decay={2} />
      <pointLight position={[-6, -2, 4]} color="#8b5cf6" intensity={0.9} distance={18} decay={2} />
      <pointLight position={[0, 6, -4]} color="#00b8d4" intensity={0.5} distance={22} decay={2} />
    </>
  )
}

// ───────────────────────────────────────────
// Main Scene
// ───────────────────────────────────────────
export default function LandingScene() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#020204' }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Canvas
          camera={{ position: [0, 1.5, 10], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <fog attach="fog" args={['#020204', 14, 30]} />
          <SceneLights />
          <Stars radius={70} depth={50} count={800} factor={3} saturation={0} fade speed={0.3} />
          <ModelHub />
          <POISatellites />
          <WikiCards />
          <GridFloor />
          <DataMotes />
        </Canvas>
      </div>

      {/* Vignette overlay for depth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 70% 60% at 50% 45%, transparent 30%, #020204 100%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* Bottom fade */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 180,
          background: 'linear-gradient(to top, var(--bg-primary), transparent)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

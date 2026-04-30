import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function GridFloor() {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.z = (state.clock.elapsedTime * 0.5) % 1
    }
  })

  return (
    <group ref={groupRef}>
      <gridHelper args={[50, 50, '#00e5ff', '#0a2a3a']} position={[0, -2, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.01, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshBasicMaterial color="#050508" transparent opacity={0.8} />
      </mesh>
    </group>
  )
}

function FloatingParticles() {
  const pointsRef = useRef()
  const count = 200

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30
      const isCyan = Math.random() > 0.6
      col[i * 3] = isCyan ? 0 : 0.6
      col[i * 3 + 1] = isCyan ? 0.9 : 0.3
      col[i * 3 + 2] = isCyan ? 1 : 0.9
    }
    return [pos, col]
  }, [])

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1
    }
  })

  const geo = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geometry
  }, [positions, colors])

  return (
    <points ref={pointsRef} geometry={geo}>
      <pointsMaterial size={0.05} vertexColors transparent opacity={0.8} sizeAttenuation />
    </points>
  )
}

function FloatingOrbitals() {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.1
    }
  })

  return (
    <group ref={groupRef}>
      {[
        { radius: 4, color: '#00e5ff', opacity: 0.15 },
        { radius: 5.5, color: '#a855f7', opacity: 0.1 },
        { radius: 3, color: '#00e5ff', opacity: 0.08 },
      ].map((ring, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[ring.radius, 0.02, 8, 100]} />
          <meshBasicMaterial color={ring.color} transparent opacity={ring.opacity} />
        </mesh>
      ))}
    </group>
  )
}

function WireframeBox() {
  const meshRef = useRef()
  const edgesRef = useRef()

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.15
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.25
    }
    if (edgesRef.current) {
      edgesRef.current.rotation.x = state.clock.elapsedTime * 0.15
      edgesRef.current.rotation.y = state.clock.elapsedTime * 0.25
    }
  })

  const boxGeo = useMemo(() => new THREE.BoxGeometry(2, 2, 2), [])
  const edgesGeo = useMemo(() => new THREE.EdgesGeometry(boxGeo), [boxGeo])

  return (
    <group position={[0, 0, 0]}>
      <mesh ref={meshRef}>
        <boxGeometry args={[2, 2, 2]} />
        <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={0.12} />
      </mesh>
      <lineSegments ref={edgesRef} geometry={edgesGeo}>
        <lineBasicMaterial color="#00e5ff" transparent opacity={0.35} />
      </lineSegments>
    </group>
  )
}

export default function LandingScene() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 2, 10], fov: 60 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['transparent']} />
        <fog attach="fog" args={['#050508', 10, 30]} />
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#00e5ff" />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#a855f7" />
        <GridFloor />
        <FloatingParticles />
        <FloatingOrbitals />
        <WireframeBox />
      </Canvas>
    </div>
  )
}

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import * as THREE from 'three'

// ───────────────────────────────────────────
// Matrix Rain - full-screen Canvas 2D layer
// ───────────────────────────────────────────
function MatrixRain() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const cols = 50
    const colW = canvas.width / cols
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789零一二三四五六七八九十書籍库数据文件模型'
    const drops = Array.from({ length: cols }, () => ({
      y: Math.random() * -canvas.height,
      speed: 1.5 + Math.random() * 2.5,
      char: chars[Math.floor(Math.random() * chars.length)],
      visible: Math.random() > 0.3
    }))

    const draw = () => {
      ctx.fillStyle = 'rgba(2,2,4,0.12)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = `${Math.max(12, colW * 0.8)}px "JetBrains Mono", monospace`
      ctx.textAlign = 'center'

      drops.forEach((drop, i) => {
        if (!drop.visible) {
          drop.y += drop.speed
          if (drop.y > canvas.height) drop.y = -30
          return
        }

        const x = i * colW + colW / 2
        const tailLen = 12

        for (let t = 0; t < tailLen; t++) {
          const ty = drop.y - t * colW
          if (ty < 0 || ty > canvas.height) continue
          const alpha = t === 0 ? 1.0 : Math.max(0, (1 - t / tailLen) * 0.5)
          const isHead = t === 0
          ctx.fillStyle = isHead ? `rgba(180,255,220,${alpha})` : `rgba(0,255,136,${alpha})`
          ctx.fillText(drop.char, x, ty)
        }

        drop.y += drop.speed
        if (drop.y - tailLen * colW > canvas.height) {
          drop.y = -Math.random() * 200
          drop.speed = 1.5 + Math.random() * 2.5
          drop.char = chars[Math.floor(Math.random() * chars.length)]
          drop.visible = Math.random() > 0.2
        }
      })

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        opacity: 0.55,
      }}
    />
  )
}

// ───────────────────────────────────────────
// Floating Books (R3F)
// ───────────────────────────────────────────
function FloatingBooks() {
  const groupRef = useRef()

  const books = useMemo(() => {
    const arr = []
    for (let i = 0; i < 18; i++) {
      arr.push({
        pos: [
          (Math.random() - 0.5) * 18,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 8 - 3,
        ],
        rot: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * 0.2],
        scale: [0.2 + Math.random() * 0.4, 0.8 + Math.random() * 1.2, 0.08 + Math.random() * 0.15],
        speed: 0.15 + Math.random() * 0.35,
        offset: Math.random() * Math.PI * 2,
        color: new THREE.Color().setHSL(0.35 + Math.random() * 0.12, 0.6, 0.08 + Math.random() * 0.08),
        edgeColor: new THREE.Color().setHSL(0.38 + Math.random() * 0.08, 0.9, 0.4 + Math.random() * 0.3),
      })
    }
    return arr
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    groupRef.current.children.forEach((child, i) => {
      const b = books[i]
      child.position.y = b.pos[1] + Math.sin(t * b.speed + b.offset) * 0.8
      child.rotation.y = b.rot[1] + t * 0.08 * b.speed
      child.rotation.x = b.rot[0] + Math.sin(t * 0.4 + b.offset) * 0.05
    })
  })

  return (
    <group ref={groupRef}>
      {books.map((b, i) => (
        <group key={i} position={b.pos} rotation={b.rot}>
          <mesh>
            <boxGeometry args={b.scale} />
            <meshStandardMaterial color={b.color} roughness={0.85} metalness={0.05} />
          </mesh>
          {/* Edge glow */}
          <mesh scale={[b.scale[0] + 0.01, b.scale[1] + 0.01, b.scale[2] + 0.01]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color={b.edgeColor} transparent opacity={0.08} wireframe />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ───────────────────────────────────────────
// Particle Swirl (pages / data streams)
// ───────────────────────────────────────────
function ParticleSwirl() {
  const ref = useRef()
  const count = 400

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const c1 = new THREE.Color('#00ff88')
    const c2 = new THREE.Color('#ffaa33')
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 12
      const radius = 1.5 + (i / count) * 6
      const y = ((i / count) * 10) - 5
      pos[i * 3] = Math.cos(angle) * radius
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = Math.sin(angle) * radius
      const mix = Math.random()
      const color = c1.clone().lerp(c2, mix)
      col[i * 3] = color.r
      col[i * 3 + 1] = color.g
      col[i * 3 + 2] = color.b
    }
    return [pos, col]
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const pos = ref.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      const baseAngle = (i / count) * Math.PI * 12
      const radius = 1.5 + (i / count) * 6
      const phase = t * 0.4 + baseAngle
      pos[i * 3] = Math.cos(phase) * radius
      pos[i * 3 + 1] = Math.sin(t * 0.3 + i * 0.05) * 0.5 + ((i / count) * 8) - 4
      pos[i * 3 + 2] = Math.sin(phase) * radius
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.06} vertexColors transparent opacity={0.9} sizeAttenuation />
    </points>
  )
}

// ───────────────────────────────────────────
// Central Archive Core (rotating cylinder)
// ───────────────────────────────────────────
function ArchiveCore() {
  const ref = useRef()
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    ref.current.rotation.y = t * 0.2
    ref.current.rotation.z = Math.sin(t * 0.3) * 0.05
  })

  return (
    <group ref={ref} position={[0, 0, -4]}>
      <mesh>
        <cylinderGeometry args={[1.2, 1.2, 3.5, 32, 1, true]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.06} side={THREE.DoubleSide} wireframe />
      </mesh>
      <mesh>
        <cylinderGeometry args={[1.25, 1.25, 3.6, 32, 1, true]} />
        <meshBasicMaterial color="#ffaa33" transparent opacity={0.03} side={THREE.DoubleSide} wireframe />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.015, 8, 64]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.4} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 1.3, 0]}>
        <torusGeometry args={[1.2, 0.01, 8, 64]} />
        <meshBasicMaterial color="#ffaa33" transparent opacity={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -1.3, 0]}>
        <torusGeometry args={[1.2, 0.01, 8, 64]} />
        <meshBasicMaterial color="#ffaa33" transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

// ───────────────────────────────────────────
// Reading Light (warm amber point light)
// ───────────────────────────────────────────
function ReadingLights() {
  return (
    <>
      <pointLight position={[-5, 4, 2]} color="#ffaa33" intensity={1.2} distance={18} decay={2} />
      <pointLight position={[5, -3, 3]} color="#ffaa33" intensity={0.8} distance={14} decay={2} />
      <pointLight position={[0, 5, 5]} color="#00ff88" intensity={0.5} distance={20} decay={2} />
    </>
  )
}

// ───────────────────────────────────────────
// Main Scene export
// ───────────────────────────────────────────
export default function LandingScene() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#020204' }}>
      {/* Matrix Rain background layer */}
      <MatrixRain />

      {/* R3F scene on top */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <Canvas
          camera={{ position: [0, 0, 9], fov: 55 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <fog attach="fog" args={['#020204', 12, 28]} />
          <ambientLight intensity={0.15} color="#aaccff" />
          <ReadingLights />
          <ArchiveCore />
          <FloatingBooks />
          <ParticleSwirl />
        </Canvas>
      </div>

      {/* Bottom fade */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 200,
          background: 'linear-gradient(to top, var(--bg-primary), transparent)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

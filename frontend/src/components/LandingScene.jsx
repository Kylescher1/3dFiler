import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'

// ───────────────────────────────────────────
// Procedural Texture Generators
// ───────────────────────────────────────────
function createDataTexture(baseColor = '#00f5d4') {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  // Dark background
  ctx.fillStyle = '#020204'
  ctx.fillRect(0, 0, size, size)

  // Grid lines
  ctx.strokeStyle = baseColor
  ctx.globalAlpha = 0.15
  ctx.lineWidth = 1
  const step = 32
  for (let i = 0; i <= size; i += step) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, size)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(size, i)
    ctx.stroke()
  }

  // Random circuit nodes
  ctx.globalAlpha = 0.35
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(Math.random() * (size / step)) * step
    const y = Math.floor(Math.random() * (size / step)) * step
    const r = 2 + Math.random() * 4
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = baseColor
    ctx.fill()

    // Lines from nodes
    if (Math.random() > 0.5) {
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + (Math.random() > 0.5 ? step * 2 : -step * 2), y)
      ctx.strokeStyle = baseColor
      ctx.lineWidth = 0.8
      ctx.stroke()
    }
    if (Math.random() > 0.5) {
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x, y + (Math.random() > 0.5 ? step * 2 : -step * 2))
      ctx.strokeStyle = baseColor
      ctx.lineWidth = 0.8
      ctx.stroke()
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

function createHexTexture(baseColor = '#8b5cf6') {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#020204'
  ctx.fillRect(0, 0, size, size)

  const hexSize = 24
  const hexW = hexSize * Math.sqrt(3)
  const hexH = hexSize * 2

  ctx.strokeStyle = baseColor
  ctx.lineWidth = 1
  ctx.globalAlpha = 0.2

  for (let row = 0; row < size / hexH + 2; row++) {
    for (let col = 0; col < size / hexW + 2; col++) {
      const x = col * hexW + (row % 2) * (hexW / 2)
      const y = row * (hexH * 0.75)
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6
        const px = x + hexSize * Math.cos(angle)
        const py = y + hexSize * Math.sin(angle)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.stroke()
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

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
          // Cyan/teal themed instead of pure green
          ctx.fillStyle = isHead
            ? `rgba(0,245,212,${alpha})`
            : `rgba(0,184,212,${alpha * 0.7})`
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
        opacity: 0.45,
      }}
    />
  )
}

// ───────────────────────────────────────────
// Floating Data Crystals (textured R3F)
// ───────────────────────────────────────────
function DataCrystals() {
  const groupRef = useRef()

  const [gridTex, hexTex] = useMemo(() => {
    return [createDataTexture('#00f5d4'), createHexTexture('#8b5cf6')]
  }, [])

  const crystals = useMemo(() => {
    const arr = []
    for (let i = 0; i < 14; i++) {
      const type = i % 3
      arr.push({
        type,
        pos: [
          (Math.random() - 0.5) * 18,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 8 - 3,
        ],
        rot: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * 0.2],
        scale: type === 0 ? [0.6, 0.9, 0.6] : type === 1 ? [0.7, 0.7, 0.7] : [1.2, 0.05, 0.8],
        speed: 0.15 + Math.random() * 0.35,
        offset: Math.random() * Math.PI * 2,
        tex: type === 2 ? gridTex : hexTex,
        color: type === 2 ? '#00f5d4' : '#8b5cf6',
      })
    }
    return arr
  }, [gridTex, hexTex])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    groupRef.current.children.forEach((child, i) => {
      const c = crystals[i]
      child.position.y = c.pos[1] + Math.sin(t * c.speed + c.offset) * 0.8
      child.rotation.y = c.rot[1] + t * 0.08 * c.speed
      child.rotation.x = c.rot[0] + Math.sin(t * 0.4 + c.offset) * 0.05
    })
  })

  return (
    <group ref={groupRef}>
      {crystals.map((c, i) => (
        <group key={i} position={c.pos} rotation={c.rot}>
          {c.type === 0 && (
            <mesh>
              <octahedronGeometry args={[0.5, 0]} />
              <meshStandardMaterial
                map={c.tex}
                color={c.color}
                roughness={0.3}
                metalness={0.6}
                emissive={c.color}
                emissiveIntensity={0.15}
                transparent
                opacity={0.9}
              />
            </mesh>
          )}
          {c.type === 1 && (
            <mesh>
              <icosahedronGeometry args={[0.45, 0]} />
              <meshStandardMaterial
                map={c.tex}
                color={c.color}
                roughness={0.2}
                metalness={0.7}
                emissive={c.color}
                emissiveIntensity={0.2}
                transparent
                opacity={0.85}
                wireframe={false}
              />
            </mesh>
          )}
          {c.type === 2 && (
            <mesh>
              <planeGeometry args={[1.2, 0.8]} />
              <meshStandardMaterial
                map={c.tex}
                color={c.color}
                roughness={0.4}
                metalness={0.5}
                emissive={c.color}
                emissiveIntensity={0.1}
                side={THREE.DoubleSide}
                transparent
                opacity={0.75}
              />
            </mesh>
          )}
          {/* Edge glow */}
          <mesh scale={[1.02, 1.02, 1.02]}>
            {c.type === 0 ? <octahedronGeometry args={[0.5, 0]} /> :
             c.type === 1 ? <icosahedronGeometry args={[0.45, 0]} /> :
             <planeGeometry args={[1.2, 0.8]} />}
            <meshBasicMaterial color={c.color} transparent opacity={0.06} wireframe />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ───────────────────────────────────────────
// Particle Swirl (cyan / purple themed)
// ───────────────────────────────────────────
function ParticleSwirl() {
  const ref = useRef()
  const count = 400

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const c1 = new THREE.Color('#00f5d4')
    const c2 = new THREE.Color('#8b5cf6')
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
        <meshBasicMaterial color="#00f5d4" transparent opacity={0.06} side={THREE.DoubleSide} wireframe />
      </mesh>
      <mesh>
        <cylinderGeometry args={[1.25, 1.25, 3.6, 32, 1, true]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.04} side={THREE.DoubleSide} wireframe />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.015, 8, 64]} />
        <meshBasicMaterial color="#00f5d4" transparent opacity={0.4} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 1.3, 0]}>
        <torusGeometry args={[1.2, 0.01, 8, 64]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -1.3, 0]}>
        <torusGeometry args={[1.2, 0.01, 8, 64]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

// ───────────────────────────────────────────
// Ambient Lights
// ───────────────────────────────────────────
function SceneLights() {
  return (
    <>
      <pointLight position={[-5, 4, 2]} color="#00f5d4" intensity={1.0} distance={18} decay={2} />
      <pointLight position={[5, -3, 3]} color="#8b5cf6" intensity={0.8} distance={14} decay={2} />
      <pointLight position={[0, 5, 5]} color="#00b8d4" intensity={0.5} distance={20} decay={2} />
      <ambientLight intensity={0.12} color="#aaccff" />
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
          <SceneLights />
          <Stars radius={60} depth={40} count={1500} factor={3} saturation={0} fade speed={0.5} />
          <ArchiveCore />
          <DataCrystals />
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

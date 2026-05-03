import { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'

export function POIMarker({ position, title, onClick, onDragEnd, selected, index, modelRef, controlsRef }) {
  const [hovered, setHovered] = useState(false)
  const [dragging, setDragging] = useState(false)
  const groupRef = useRef()
  const markerRef = useRef()
  const refDist = useRef(7)
  const dragStartRef = useRef(null)
  const hasDraggedRef = useRef(false)
  const { camera, gl } = useThree()
  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())

  const showLabel = selected || hovered
  const color = selected ? '#b91c1c' : hovered ? '#dc2626' : '#b91c1c'

  useEffect(() => {
    if (!dragging) return

    const handleMove = (e) => {
      const start = dragStartRef.current
      if (start) {
        const dx = e.clientX - start.x
        const dy = e.clientY - start.y
        if (Math.hypot(dx, dy) > 3) {
          hasDraggedRef.current = true
        }
      }

      const rect = gl.domElement.getBoundingClientRect()
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.current.setFromCamera(mouse.current, camera)
      const targets = []
      if (modelRef?.current) targets.push(modelRef.current)
      const intersects = raycaster.current.intersectObjects(targets, true)
      if (intersects.length > 0 && groupRef.current) {
        const p = intersects[0].point
        groupRef.current.position.set(p.x, p.y + 0.05, p.z)
      }
    }

    const handleUp = () => {
      setDragging(false)
      document.body.style.cursor = 'default'

      if (controlsRef?.current) controlsRef.current.enabled = true

      if (hasDraggedRef.current && groupRef.current) {
        const p = groupRef.current.position
        onDragEnd?.({ x: p.x, y: p.y - 0.05, z: p.z })
      } else if (!hasDraggedRef.current) {
        onClick?.()
      }

      dragStartRef.current = null
      hasDraggedRef.current = false
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [dragging, camera, gl, modelRef, onDragEnd, onClick])

  const handleMouseDown = (e) => {
    e.stopPropagation()
    e.preventDefault()
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    hasDraggedRef.current = false
    setDragging(true)
    document.body.style.cursor = 'grabbing'
    if (controlsRef?.current) controlsRef.current.enabled = false
  }

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
          onMouseDown={handleMouseDown}
          onMouseEnter={() => { if (!dragging) { setHovered(true); document.body.style.cursor = 'pointer' } }}
          onMouseLeave={() => { if (!dragging) { setHovered(false); document.body.style.cursor = 'default' } }}
          style={{
            transformOrigin: 'center center',
            transition: dragging ? 'none' : 'transform 0.08s linear',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            cursor: dragging ? 'grabbing' : 'pointer',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 800,
              color: '#111',
              background: selected ? 'rgba(185,28,28,0.35)' : hovered ? 'rgba(185,28,28,0.25)' : 'rgba(250,250,252,0.9)',
              border: `3px solid ${color}`,
              boxShadow: hovered || selected ? `0 0 20px ${color}cc, 0 0 8px ${color}88` : '0 2px 10px rgba(0,0,0,0.25)',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              cursor: dragging ? 'grabbing' : 'pointer',
              position: 'relative',
              zIndex: 2,
            }}
            title={title || 'POI'}
          >
            {index}
          </div>
          {/* Outer attention ring */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            border: `2px solid ${color}44`,
            zIndex: 1,
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '62px',
            height: '62px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
            zIndex: 0,
            pointerEvents: 'none',
          }} />
          {showLabel && (
            <div style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(255, 255, 255, 0.98)',
              color: '#333333',
              padding: '5px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border: `1.5px solid ${color}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              letterSpacing: '0.3px',
              pointerEvents: 'none',
              zIndex: 3,
            }}>
              {title || 'POI'}
            </div>
          )}
        </div>
      </Html>
    </group>
  )
}

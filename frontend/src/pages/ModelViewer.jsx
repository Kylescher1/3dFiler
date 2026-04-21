import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, Box } from '@react-three/drei'
import * as THREE from 'three'
import { ModelRenderer, SUPPORTED_FORMATS } from '../components/ModelRenderer'
import { POIMarker } from '../components/POIMarker'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function normalizePoi(poi) {
  if (poi.positionX !== undefined) {
    return { ...poi, position: { x: poi.positionX, y: poi.positionY, z: poi.positionZ } }
  }
  return poi
}

function ClickPlane({ onClick, modelRef }) {
  const { camera, gl } = useThree()
  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())
  const planeRef = useRef()

  useEffect(() => {
    const handler = (e) => {
      const rect = gl.domElement.getBoundingClientRect()
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.current.setFromCamera(mouse.current, camera)
      const targets = []
      if (modelRef.current) targets.push(modelRef.current)
      if (planeRef.current) targets.push(planeRef.current)
      const intersects = raycaster.current.intersectObjects(targets, true)
      if (intersects.length > 0) onClick(intersects[0].point)
    }
    gl.domElement.addEventListener('dblclick', handler)
    return () => gl.domElement.removeEventListener('dblclick', handler)
  }, [camera, gl, onClick, modelRef])

  return (
    <mesh ref={planeRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} visible={false}>
      <planeGeometry args={[50, 50]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  )
}

function WireframeToggle({ modelRef, wireframe }) {
  useEffect(() => {
    if (!modelRef.current) return
    modelRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        mats.forEach((mat) => { mat.wireframe = wireframe })
      }
    })
  }, [wireframe, modelRef])
  return null
}

function CameraFocus({ controlsRef, targetRef, trigger, onDone }) {
  const { camera } = useThree()
  const animating = useRef(false)

  useEffect(() => {
    if (!trigger || !targetRef.current || !controlsRef.current || animating.current) return
    animating.current = true
    const box = new THREE.Box3().setFromObject(targetRef.current)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const fov = camera.fov * (Math.PI / 180)
    const distance = Math.abs(maxDim / Math.sin(fov / 2)) * 0.75 + 1.5
    const endPos = new THREE.Vector3(center.x + distance * 0.7, center.y + distance * 0.5, center.z + distance * 0.7)
    const startPos = camera.position.clone()
    const startTarget = controlsRef.current.target.clone()
    let t = 0
    const animate = () => {
      t += 0.035
      if (t >= 1) {
        camera.position.copy(endPos)
        controlsRef.current.target.copy(center)
        controlsRef.current.update()
        animating.current = false
        onDone?.()
        return
      }
      const ease = 1 - Math.pow(1 - t, 3)
      camera.position.lerpVectors(startPos, endPos, ease)
      controlsRef.current.target.lerpVectors(startTarget, center, ease)
      controlsRef.current.update()
      requestAnimationFrame(animate)
    }
    animate()
  }, [trigger, targetRef, controlsRef, camera, onDone])
  return null
}

function SceneContent({ modelUrl, extension, pois, selectedPoi, onPoiClick, onAddPoi, modelRef, showGrid, wireframe, autoRotate, controlsRef, focusTrigger, onFocusDone }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.4} />
      <pointLight position={[0, -5, 0]} intensity={0.2} />
      <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.08} autoRotate={autoRotate} autoRotateSpeed={1.2} minDistance={0.5} maxDistance={50} />
      {showGrid && <Grid args={[20, 20]} position={[0, -0.01, 0]} />}
      <ClickPlane onClick={onAddPoi} modelRef={modelRef} />
      <group ref={modelRef}>
        {modelUrl ? (
          <ModelRenderer url={modelUrl} extension={extension} onReady={(obj) => { modelRef.current = obj }} />
        ) : (
          <Box args={[1, 1, 1]} position={[0, 0.5, 0]}><meshStandardMaterial color="#333" wireframe /></Box>
        )}
      </group>
      <WireframeToggle modelRef={modelRef} wireframe={wireframe} />
      <CameraFocus controlsRef={controlsRef} targetRef={modelRef} trigger={focusTrigger} onDone={onFocusDone} />
      {pois.map((poi, idx) => (
        <POIMarker key={poi.id} index={idx + 1} position={poi.position} title={poi.title} selected={selectedPoi?.id === poi.id} onClick={() => onPoiClick(poi)} />
      ))}
    </>
  )
}

function PoiForm({ title, content, type, onTitleChange, onContentChange, onTypeChange, onSave, onCancel, onDelete, deleteLabel, myModels, currentModelId }) {
  return (
    <div>
      <h3 style={{ color: '#4fc3f7', marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 600 }}>{title ? 'Edit Point of Interest' : 'New Point of Interest'}</h3>
      <div className="form-group"><label>Title</label><input type="text" value={title} onChange={(e) => onTitleChange(e.target.value)} /></div>
      <div className="form-group">
        <label>Type</label>
        <select value={type} onChange={(e) => onTypeChange(e.target.value)} style={{ width: '100%', padding: '0.5rem', background: '#111', color: '#e0e0e0', border: '1px solid #2a2a2a', borderRadius: '6px' }}>
          <option value="text">Text</option>
          <option value="nested-model">Nested Model</option>
        </select>
      </div>
      <div className="form-group">
        <label>{type === 'text' ? 'Content' : 'Linked Model'}</label>
        {type === 'nested-model' ? (
          <select value={content} onChange={(e) => onContentChange(e.target.value)} style={{ width: '100%', padding: '0.5rem', background: '#111', color: '#e0e0e0', border: '1px solid #2a2a2a', borderRadius: '6px' }}>
            <option value="">Select a model...</option>
            {myModels?.filter(m => m.id !== currentModelId).map(m => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        ) : (
          <textarea rows={3} value={content} onChange={(e) => onContentChange(e.target.value)} />
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={onSave} className="btn" style={{ flex: 1, padding: '0.5rem' }}>Save</button>
        <button onClick={onCancel} className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem' }}>Cancel</button>
        {onDelete && (
          <button onClick={onDelete} className="btn btn-secondary" style={{ padding: '0.5rem', background: '#3e2723', borderColor: '#5d4037', color: '#ffab91' }}>{deleteLabel || 'Delete'}</button>
        )}
      </div>
    </div>
  )
}

const controlIcons = {
  focus: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
  ),
  reset: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 20H4v-4h4v4zm0-6H4v-4h4v4zm0-6H4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4z"/></svg>
  ),
  wireframe: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/><path d="M4 6h16M4 10h16M4 14h16M4 18h16M8 6v12M12 6v12M16 6v12" stroke="currentColor" strokeWidth="1"/></svg>
  ),
  rotate: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8A5.87 5.87 0 016 12c0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/></svg>
  ),
  screenshot: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9 3L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
  ),
  fullscreen: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
  ),
  bg: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 3a9 9 0 000 18 9 9 0 000-18zm0 16a7 7 0 110-14 7 7 0 010 14z"/></svg>
  ),
}

function ModelViewer() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [model, setModel] = useState(null)
  const [pois, setPois] = useState([])
  const [myModels, setMyModels] = useState([])
  const [selectedPoi, setSelectedPoi] = useState(null)
  const [addingPoi, setAddingPoi] = useState(null)
  const [editingPoi, setEditingPoi] = useState(null)
  const [poiForm, setPoiForm] = useState({ title: '', content: '', type: 'text' })
  const [error, setError] = useState('')
  const [showGrid, setShowGrid] = useState(true)
  const [wireframe, setWireframe] = useState(false)
  const [autoRotate, setAutoRotate] = useState(false)
  const [bgDark, setBgDark] = useState(true)
  const [focusTrigger, setFocusTrigger] = useState(0)
  const [initialFocusDone, setInitialFocusDone] = useState(false)
  const [showPoiList, setShowPoiList] = useState(true)
  const [flash, setFlash] = useState(false)
  const controlsRef = useRef()
  const modelRef = useRef(null)
  const canvasContainerRef = useRef(null)
  const token = localStorage.getItem('token')

  useEffect(() => {
    setModel(null)
    setPois([])
    setSelectedPoi(null)
    setAddingPoi(null)
    setEditingPoi(null)
    setPoiForm({ title: '', content: '', type: 'text' })
    setInitialFocusDone(false)
    setFocusTrigger(0)
    if (modelRef.current) modelRef.current = null

    const headers = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const url = `${API}/models/${id}${searchParams.toString() ? '?' + searchParams.toString() : ''}`
    fetch(url, { headers })
      .then((r) => { if (!r.ok) throw new Error(r.status === 403 ? 'Private model' : 'Not found'); return r.json() })
      .then((data) => { setModel(data); setPois((data.pois || []).map(normalizePoi)) })
      .catch((err) => setError(err.message))

    if (token) {
      fetch(`${API}/models/mine`, { headers })
        .then(r => r.json())
        .then(setMyModels)
    }
  }, [id, searchParams, token])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        setAddingPoi(null)
        setEditingPoi(null)
        setSelectedPoi(null)
        setPoiForm({ title: '', content: '', type: 'text' })
      }
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      const key = e.key.toLowerCase()
      if (key === 'f') { e.preventDefault(); handleFocus() }
      if (key === 'g') { e.preventDefault(); setShowGrid((v) => !v) }
      if (key === 'w') { e.preventDefault(); setWireframe((v) => !v) }
      if (key === 'r') { e.preventDefault(); setAutoRotate((v) => !v) }
      if (key === 's') { e.preventDefault(); handleScreenshot() }
      if (key === 'n' && selectedPoi) {
        e.preventDefault()
        const idx = pois.findIndex((p) => p.id === selectedPoi.id)
        if (idx >= 0 && idx < pois.length - 1) setSelectedPoi(pois[idx + 1])
      }
      if (key === 'p' && selectedPoi) {
        e.preventDefault()
        const idx = pois.findIndex((p) => p.id === selectedPoi.id)
        if (idx > 0) setSelectedPoi(pois[idx - 1])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedPoi, pois])

  useEffect(() => {
    if (initialFocusDone) return
    const timer = setTimeout(() => { if (modelRef.current) setFocusTrigger((n) => n + 1) }, 500)
    return () => clearTimeout(timer)
  }, [model, initialFocusDone])

  const [modelBounds, setModelBounds] = useState(null)

  const handleFocusDone = useCallback(() => {
    setInitialFocusDone(true)
    if (modelRef.current) {
      const box = new THREE.Box3().setFromObject(modelRef.current)
      const size = box.getSize(new THREE.Vector3())
      setModelBounds({ w: size.x.toFixed(2), h: size.y.toFixed(2), d: size.z.toFixed(2) })
    }
  }, [])

  const handleAddPoi = useCallback((point) => {
    setAddingPoi({ x: point.x, y: point.y, z: point.z })
    setEditingPoi(null)
    setSelectedPoi(null)
    setPoiForm({ title: '', content: '', type: 'text' })
  }, [])

  const handlePoiClick = useCallback((poi) => {
    setSelectedPoi(poi)
    setEditingPoi(null)
    setAddingPoi(null)
  }, [])

  const submitPoi = async () => {
    const res = await fetch(`${API}/pois`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ modelId: id, position: addingPoi, title: poiForm.title, content: poiForm.content, type: poiForm.type })
    })
    const data = await res.json()
    if (res.ok) { setPois((prev) => [...prev, normalizePoi(data)]); setAddingPoi(null); setPoiForm({ title: '', content: '', type: 'text' }) }
  }

  const startEditPoi = (poi) => {
    setEditingPoi(poi)
    setSelectedPoi(null)
    setAddingPoi(null)
    setPoiForm({ title: poi.title, content: poi.content, type: poi.type })
  }

  const saveEditPoi = async () => {
    if (!editingPoi) return
    const res = await fetch(`${API}/pois/${editingPoi.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: poiForm.title, content: poiForm.content, type: poiForm.type })
    })
    const data = await res.json()
    if (res.ok) {
      setPois((prev) => prev.map((p) => p.id === editingPoi.id ? normalizePoi(data) : p))
      setEditingPoi(null)
      setPoiForm({ title: '', content: '', type: 'text' })
    }
  }

  const deletePoi = async () => {
    if (!editingPoi && !selectedPoi) return
    const target = editingPoi || selectedPoi
    if (!confirm(`Delete "${target.title}"?`)) return
    const res = await fetch(`${API}/pois/${target.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) {
      setPois((prev) => prev.filter((p) => p.id !== target.id))
      setEditingPoi(null)
      setSelectedPoi(null)
    }
  }

  const handleScreenshot = () => {
    const canvas = canvasContainerRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `3dFiler-${model?.title || 'screenshot'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    setFlash(true)
    setTimeout(() => setFlash(false), 200)
  }

  const handleFullscreen = () => {
    const el = canvasContainerRef.current
    if (!el) return
    if (!document.fullscreenElement) el.requestFullscreen?.()
    else document.exitFullscreen?.()
  }

  const handleReset = () => {
    if (controlsRef.current) { controlsRef.current.reset(); controlsRef.current.target.set(0, 0, 0); controlsRef.current.update() }
  }

  const handleFocus = () => setFocusTrigger((n) => n + 1)

  if (error) return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#ef5350', zIndex: 100 }}>
      {error}
    </div>
  )
  if (!model) return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#888', zIndex: 100 }}>
      Loading...
    </div>
  )

  const extension = model.originalName?.split('.').pop()
  const isSupported = SUPPORTED_FORMATS.includes(extension?.toLowerCase())
  const modelUrl = isSupported && model.filename ? `${API.replace('/api', '')}/uploads/${model.filename}` : null

  const overlayBg = 'rgba(12, 12, 16, 0.88)'
  const panelStyle = {
    background: overlayBg,
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
    backdropFilter: 'blur(6px)',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: bgDark ? '#0a0a0a' : '#e8e8e8', zIndex: 100 }}>
      {/* Screenshot flash */}
      {flash && (
        <div style={{ position: 'fixed', inset: 0, background: 'white', opacity: 0.3, pointerEvents: 'none', zIndex: 9999, animation: 'flashOut 0.3s ease forwards' }} />
      )}

      {/* Full viewport canvas */}
      <div ref={canvasContainerRef} style={{ position: 'absolute', inset: 0 }} onClick={(e) => { if (e.target === canvasContainerRef.current || e.target.tagName === 'CANVAS') setSelectedPoi(null) }}>
        <Canvas camera={{ position: [4, 4, 4], fov: 50 }} style={{ width: '100%', height: '100%' }} gl={{ preserveDrawingBuffer: true }}>
          <color attach="background" args={[bgDark ? '#0a0a0a' : '#e8e8e8']} />
          <SceneContent modelUrl={modelUrl} extension={extension} pois={pois} selectedPoi={selectedPoi} onPoiClick={handlePoiClick} onAddPoi={handleAddPoi} modelRef={modelRef} showGrid={showGrid} wireframe={wireframe} autoRotate={autoRotate} controlsRef={controlsRef} focusTrigger={focusTrigger} onFocusDone={handleFocusDone} />
        </Canvas>
      </div>

      {/* Top overlay bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', zIndex: 20, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '12px', ...panelStyle, padding: '8px 14px' }}>
          <Link to="/dashboard" style={{ color: '#4fc3f7', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>3dFiler</Link>
          <div style={{ width: '1px', height: '20px', background: '#2a2a2a' }} />
          <div>
            <h1 style={{ color: '#e0e0e0', fontSize: '0.95rem', margin: 0, fontWeight: 600, lineHeight: 1.2 }}>{model.title}</h1>
            {model.description && <p style={{ color: '#777', fontSize: '0.75rem', margin: '2px 0 0', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{model.description}</p>}
          </div>
        </div>

        {/* Scene controls */}
        <div style={{ pointerEvents: 'auto', display: 'flex', gap: '2px', ...panelStyle, padding: '4px' }}>
          {[
            { icon: controlIcons.focus, onClick: handleFocus, title: 'Focus' },
            { icon: controlIcons.reset, onClick: handleReset, title: 'Reset' },
          ].map((c, i) => (
            <button key={i} onClick={c.onClick} title={c.title} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: '6px', color: '#aaa', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = '#2a2a2a'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>{c.icon}</button>
          ))}
          <div style={{ width: '1px', background: '#2a2a2a', margin: '4px 2px' }} />
          {[
            { icon: controlIcons.grid, onClick: () => setShowGrid(!showGrid), active: showGrid, title: 'Grid' },
            { icon: controlIcons.wireframe, onClick: () => setWireframe(!wireframe), active: wireframe, title: 'Wireframe' },
            { icon: controlIcons.rotate, onClick: () => setAutoRotate(!autoRotate), active: autoRotate, title: 'Auto-Rotate' },
            { icon: controlIcons.bg, onClick: () => setBgDark(!bgDark), active: bgDark, title: 'Background' },
          ].map((c, i) => (
            <button key={i} onClick={c.onClick} title={c.title} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.active ? '#1e3a4c' : 'transparent', border: 'none', borderRadius: '6px', color: c.active ? '#4fc3f7' : '#aaa', cursor: 'pointer' }} onMouseEnter={e => { if (!c.active) e.currentTarget.style.background = '#2a2a2a' }} onMouseLeave={e => { if (!c.active) e.currentTarget.style.background = 'transparent' }}>{c.icon}</button>
          ))}
          <div style={{ width: '1px', background: '#2a2a2a', margin: '4px 2px' }} />
          {[
            { icon: controlIcons.screenshot, onClick: handleScreenshot, title: 'Screenshot' },
            { icon: controlIcons.fullscreen, onClick: handleFullscreen, title: 'Fullscreen' },
          ].map((c, i) => (
            <button key={i} onClick={c.onClick} title={c.title} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: '6px', color: '#aaa', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = '#2a2a2a'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>{c.icon}</button>
          ))}
        </div>
      </div>

      {/* Format warning */}
      {!isSupported && (
        <div style={{ position: 'absolute', top: 68, left: '50%', transform: 'translateX(-50%)', zIndex: 20, ...panelStyle, padding: '8px 14px', background: '#3e2723' }}>
          <p style={{ color: '#ffab91', fontSize: '0.8rem' }}><strong>Format not supported for viewing yet.</strong> Supported: GLTF, GLB, OBJ, FBX, STL.</p>
        </div>
      )}

      {/* Right sidebar - POI list */}
      <div style={{ position: 'absolute', top: 64, right: 12, bottom: 48, width: 260, zIndex: 20, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none' }}>
        {/* Toggle button */}
        <button
          onClick={() => setShowPoiList(!showPoiList)}
          style={{ pointerEvents: 'auto', alignSelf: 'flex-end', ...panelStyle, padding: '6px 10px', color: '#aaa', fontSize: '0.75rem', cursor: 'pointer', background: overlayBg, display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={showPoiList ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} /></svg>
          POIs ({pois.length})
        </button>

        {showPoiList && (
          <div style={{ pointerEvents: 'auto', ...panelStyle, padding: '12px', flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <h3 style={{ color: '#4fc3f7', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 600 }}>Points of Interest</h3>
            {pois.length === 0 ? (
              <p style={{ color: '#666', fontSize: '0.8rem' }}>No POIs yet. Double-click on the model to add one.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {pois.map((poi, idx) => (
                  <div
                    key={poi.id}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData('text/plain', idx); e.dataTransfer.effectAllowed = 'move' }}
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                    onDrop={(e) => {
                      e.preventDefault()
                      const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10)
                      if (fromIdx === idx) return
                      setPois((prev) => {
                        const next = [...prev]
                        const [moved] = next.splice(fromIdx, 1)
                        next.splice(idx, 0, moved)
                        return next
                      })
                      // Persist reorder to backend
                      const newOrder = [...pois]
                      const [moved] = newOrder.splice(fromIdx, 1)
                      newOrder.splice(idx, 0, moved)
                      fetch(`${API}/pois/reorder`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({ modelId: id, poiIds: newOrder.map((p) => p.id) })
                      }).catch(() => {})
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.4rem 0.5rem',
                      background: selectedPoi?.id === poi.id ? '#1e3a4c' : '#111',
                      border: '1px solid #2a2a2a',
                      borderRadius: '4px',
                      cursor: 'grab',
                      color: '#ccc',
                    }}
                  >
                    <span style={{
                      background: '#4fc3f7', color: '#0a0a0a', width: '18px', height: '18px', borderRadius: '50%',
                      fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>{idx + 1}</span>
                    <button
                      onClick={() => handlePoiClick(poi)}
                      style={{ textAlign: 'left', background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', flex: 1, padding: 0, fontSize: '0.8rem' }}
                    >
                      <span style={{ color: '#4fc3f7', fontWeight: 600 }}>{poi.title}</span>
                      <span style={{ color: '#666', fontSize: '0.7rem', marginLeft: '0.4rem' }}>{poi.type}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom hint + model info */}
      <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 20, display: 'flex', flexDirection: 'column', gap: '6px', pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(0,0,0,0.65)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.7rem', color: '#777', letterSpacing: '0.3px' }}>
          Double-click to add a point of interest
        </div>
        {model && (
          <div style={{ background: 'rgba(0,0,0,0.65)', padding: '6px 14px', borderRadius: '8px', fontSize: '0.7rem', color: '#888', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span><strong style={{ color: '#aaa' }}>Format:</strong> {extension?.toUpperCase() || 'Unknown'}</span>
            <span><strong style={{ color: '#aaa' }}>Size:</strong> {(model.size / 1024 / 1024).toFixed(2)} MB</span>
            {modelBounds && <span><strong style={{ color: '#aaa' }}>Dimensions:</strong> {modelBounds.w} x {modelBounds.h} x {modelBounds.d}</span>}
          </div>
        )}
      </div>

      {/* Keyboard shortcuts hint */}
      <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 20, background: 'rgba(0,0,0,0.55)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.65rem', color: '#666', pointerEvents: 'none', lineHeight: 1.6 }}>
        <strong style={{ color: '#888' }}>Shortcuts</strong><br />
        F Focus &nbsp;G Grid &nbsp;W Wireframe &nbsp;R Rotate &nbsp;S Screenshot<br />
        N Next POI &nbsp;P Prev POI &nbsp;Esc Close
      </div>

      {/* POI Detail Modal */}
      {selectedPoi && !addingPoi && !editingPoi && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }} onClick={() => setSelectedPoi(null)}>
          <div style={{ background: '#141419', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '28px', width: '460px', maxWidth: '90vw', boxShadow: '0 24px 80px rgba(0,0,0,0.7)', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedPoi(null)} style={{ position: 'absolute', top: '12px', right: '14px', background: 'none', border: 'none', color: '#666', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <h2 style={{ color: '#e0e0e0', fontSize: '1.25rem', margin: 0, fontWeight: 600 }}>{selectedPoi.title}</h2>
              <span style={{ color: '#666', fontSize: '0.7rem', border: '1px solid #2a2a2a', padding: '2px 8px', borderRadius: '12px', textTransform: 'capitalize' }}>{selectedPoi.type}</span>
            </div>

            {selectedPoi.type === 'nested-model' && selectedPoi.content ? (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '12px' }}>This POI links to another model.</p>
                <button onClick={() => navigate(`/model/${selectedPoi.content}`)} className="btn" style={{ padding: '0.5rem 1rem' }}>
                  Open Nested Model
                </button>
              </div>
            ) : (
              <div style={{ background: '#0f0f12', borderRadius: '8px', padding: '14px', marginBottom: '16px', maxHeight: '240px', overflowY: 'auto' }}>
                <p style={{ color: '#bbb', fontSize: '0.9rem', whiteSpace: 'pre-wrap', lineHeight: 1.5, margin: 0 }}>{selectedPoi.content || <em style={{ color: '#555' }}>No content.</em>}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {(() => {
                  const idx = pois.findIndex((p) => p.id === selectedPoi.id)
                  return (
                    <>
                      <button
                        onClick={() => idx > 0 && setSelectedPoi(pois[idx - 1])}
                        disabled={idx <= 0}
                        style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem', background: idx > 0 ? '#1a1a20' : '#111', border: '1px solid #2a2a2a', borderRadius: '6px', color: idx > 0 ? '#aaa' : '#444', cursor: idx > 0 ? 'pointer' : 'default' }}
                      >Prev</button>
                      <button
                        onClick={() => idx >= 0 && idx < pois.length - 1 && setSelectedPoi(pois[idx + 1])}
                        disabled={idx < 0 || idx >= pois.length - 1}
                        style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem', background: idx >= 0 && idx < pois.length - 1 ? '#1a1a20' : '#111', border: '1px solid #2a2a2a', borderRadius: '6px', color: idx >= 0 && idx < pois.length - 1 ? '#aaa' : '#444', cursor: idx >= 0 && idx < pois.length - 1 ? 'pointer' : 'default' }}
                      >Next</button>
                    </>
                  )
                })()}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => startEditPoi(selectedPoi)} className="btn btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>Edit</button>
                <button onClick={deletePoi} className="btn btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', background: '#3e2723', borderColor: '#5d4037', color: '#ffab91' }}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POI Form Modal */}
      {(addingPoi || editingPoi) && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }} onClick={() => { setAddingPoi(null); setEditingPoi(null) }}>
          <div style={{ background: '#141419', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '24px', width: '400px', maxWidth: '90vw', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }} onClick={e => e.stopPropagation()}>
            <PoiForm
              title={poiForm.title}
              content={poiForm.content}
              type={poiForm.type}
              myModels={myModels}
              currentModelId={id}
              onTitleChange={(v) => setPoiForm((f) => ({ ...f, title: v }))}
              onContentChange={(v) => setPoiForm((f) => ({ ...f, content: v }))}
              onTypeChange={(v) => setPoiForm((f) => ({ ...f, type: v }))}
              onSave={addingPoi ? submitPoi : saveEditPoi}
              onCancel={() => { setAddingPoi(null); setEditingPoi(null); setPoiForm({ title: '', content: '', type: 'text' }) }}
              onDelete={editingPoi ? deletePoi : undefined}
              deleteLabel="Delete"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ModelViewer

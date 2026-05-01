import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, Box } from '@react-three/drei'
import * as THREE from 'three'
import { ModelRenderer, SUPPORTED_FORMATS } from '../components/ModelRenderer'
import { POIMarker } from '../components/POIMarker'
import MarkdownContent from '../components/MarkdownContent'
import ModelHeader from '../components/ModelHeader'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function normalizePoi(poi) {
  if (poi.positionX !== undefined) {
    return { ...poi, position: { x: poi.positionX, y: poi.positionY, z: poi.positionZ } }
  }
  return poi
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function MetaRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{value}</span>
    </div>
  )
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

function SceneContent({ modelUrl, extension, pois, selectedPoi, onPoiClick, onAddPoi, modelRef, showGrid, wireframe, autoRotate, controlsRef, focusTrigger, onFocusDone, onModelReady, showAxes, lightingPreset, sunIntensity, sunRotation }) {
  function rotateY([x, y, z], angleDeg) {
    const rad = (angleDeg * Math.PI) / 180
    return [x * Math.cos(rad) - z * Math.sin(rad), y, x * Math.sin(rad) + z * Math.cos(rad)]
  }
  const basePositions = {
    neutral: [5, 10, 5],
    studio: [3, 8, 3],
    dramatic: [5, 10, 2]
  }
  const mainDirPos = rotateY(basePositions[lightingPreset] || basePositions.neutral, sunRotation)
  const sI = sunIntensity
  const lights = {
    neutral: (
      <>
        <ambientLight intensity={0.5 * sI} />
        <directionalLight position={mainDirPos} intensity={1 * sI} castShadow />
        <pointLight position={[-5, 5, -5]} intensity={0.4 * sI} />
        <pointLight position={[0, -5, 0]} intensity={0.2 * sI} />
      </>
    ),
    studio: (
      <>
        <ambientLight intensity={0.6 * sI} />
        <directionalLight position={mainDirPos} intensity={1.2 * sI} castShadow />
        <directionalLight position={rotateY([-3, 4, -3], sunRotation)} intensity={0.4 * sI} />
        <pointLight position={[0, 2, 0]} intensity={0.3 * sI} />
      </>
    ),
    dramatic: (
      <>
        <ambientLight intensity={0.2 * sI} />
        <directionalLight position={mainDirPos} intensity={1.5 * sI} castShadow />
        <pointLight position={[-4, 2, -4]} intensity={0.3 * sI} color="#ffaa77" />
        <pointLight position={[0, -3, 0]} intensity={0.15 * sI} color="#7799ff" />
      </>
    )
  }

  return (
    <>
      {lights[lightingPreset] || lights.neutral}
      <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.08} autoRotate={autoRotate} autoRotateSpeed={1.2} minDistance={0.5} maxDistance={50} />
      {showGrid && <Grid args={[20, 20]} position={[0, -0.01, 0]} />}
      {showAxes && <axesHelper args={[2]} />}
      <ClickPlane onClick={onAddPoi} modelRef={modelRef} />
      <group>
        {modelUrl ? (
          <ModelRenderer key={modelUrl} url={modelUrl} extension={extension} onReady={onModelReady} />
        ) : (
          <Box args={[1, 1, 1]} position={[0, 0.5, 0]}><meshStandardMaterial color="#cccccc" wireframe /></Box>
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
      <h3 style={{ color: 'var(--primary)', marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 600 }}>{title ? 'Edit Point of Interest' : 'New Point of Interest'}</h3>
      <div className="form-group"><label>Title</label><input type="text" value={title} onChange={(e) => onTitleChange(e.target.value)} /></div>
      <div className="form-group">
        <label>Type</label>
        <select value={type} onChange={(e) => onTypeChange(e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid #e5e5e5', borderRadius: '6px' }}>
          <option value="text">Text</option>
          <option value="nested-model">Nested Model</option>
        </select>
      </div>
      <div className="form-group">
        <label>{type === 'text' ? 'Content' : 'Linked Model'}</label>
        {type === 'nested-model' ? (
          <select value={content} onChange={(e) => onContentChange(e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid #e5e5e5', borderRadius: '6px' }}>
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
          <button onClick={onDelete} className="btn btn-secondary" style={{ padding: '0.5rem', background: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c' }}>{deleteLabel || 'Delete'}</button>
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
  settings: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84a.484.484 0 00-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.488.488 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.27.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 118.4 12 3.596 3.596 0 0112 15.6z"/></svg>
  ),
}

function SettingsPanel({ settings, onChange, onSave, onCancel, saving, isOwner }) {
  if (!isOwner) return null
  const presets = [
    { key: 'neutral', label: 'Neutral' },
    { key: 'studio', label: 'Studio' },
    { key: 'dramatic', label: 'Dramatic' }
  ]
  const toggle = (key) => onChange({ ...settings, [key]: !settings[key] })
  return (
    <div style={{ minWidth: 240, padding: '0.6rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.6rem' }}>
        {[
          { key: 'showGrid', label: 'Grid' },
          { key: 'showAxes', label: 'Axes' },
          { key: 'autoRotate', label: 'Auto-Rotate' },
        ].map(({ key, label }) => (
          <button key={key} type="button" onClick={() => toggle(key)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', padding: '0.4rem 0.3rem',
            border: `1px solid ${settings[key] ? 'var(--primary)' : 'var(--border-subtle)'}`,
            background: settings[key] ? 'rgba(185,28,28,0.08)' : 'transparent',
            borderRadius: 'var(--radius-sm)', color: settings[key] ? 'var(--primary)' : 'var(--text-secondary)',
            fontSize: '0.72rem', cursor: 'pointer', transition: 'all 0.2s'
          }}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.6rem' }}>
        {presets.map(({ key, label }) => (
          <button key={key} type="button" onClick={() => onChange({ ...settings, lightingPreset: key })} style={{
            flex: 1, padding: '0.35rem 0.2rem', borderRadius: 'var(--radius-sm)', fontSize: '0.68rem',
            border: `1px solid ${settings.lightingPreset === key ? 'var(--primary)' : 'var(--border-subtle)'}`,
            background: settings.lightingPreset === key ? 'rgba(185,28,28,0.08)' : 'transparent',
            color: settings.lightingPreset === key ? 'var(--primary)' : 'var(--text-secondary)',
            cursor: 'pointer', transition: 'all 0.2s'
          }}>
            {label}
          </button>
        ))}
      </div>
      {/* Sun Intensity */}
      <div style={{ marginBottom: '0.55rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
          <span>Sun Intensity</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{settings.sunIntensity.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min={0}
          max={3}
          step={0.1}
          value={settings.sunIntensity}
          onChange={e => onChange({ ...settings, sunIntensity: parseFloat(e.target.value) })}
          style={{ width: '100%', cursor: 'pointer' }}
        />
      </div>
      {/* Sun Rotation */}
      <div style={{ marginBottom: '0.55rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
          <span>Sun Rotation</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{settings.sunRotation}°</span>
        </div>
        <input
          type="range"
          min={0}
          max={360}
          step={5}
          value={settings.sunRotation}
          onChange={e => onChange({ ...settings, sunRotation: parseInt(e.target.value, 10) })}
          style={{ width: '100%', cursor: 'pointer' }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Background</span>
        <input
          type="color"
          value={settings.backgroundColor}
          onChange={e => onChange({ ...settings, backgroundColor: e.target.value })}
          style={{ width: 28, height: 20, border: 'none', borderRadius: 3, cursor: 'pointer', background: 'none' }}
        />
        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{settings.backgroundColor}</span>
      </div>
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '0.4rem', fontSize: '0.72rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
        <button onClick={onSave} disabled={saving} style={{ flex: 1, padding: '0.4rem', fontSize: '0.72rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary)', background: 'var(--primary)', color: 'var(--bg-primary)', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </div>
  )
}

function ModelViewer() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [model, setModel] = useState(null)
  const [pois, setPois] = useState([])
  const [myModels, setMyModels] = useState([])
  const [backlinks, setBacklinks] = useState([])
  const [breadcrumbs, setBreadcrumbs] = useState([])
  const [relatedModels, setRelatedModels] = useState([])
  const [showRelated, setShowRelated] = useState(false)
  const [selectedPoi, setSelectedPoi] = useState(null)
  const [addingPoi, setAddingPoi] = useState(null)
  const [editingPoi, setEditingPoi] = useState(null)
  const [poiForm, setPoiForm] = useState({ title: '', content: '', type: 'text' })
  const [error, setError] = useState('')
  const [showGrid, setShowGrid] = useState(true)
  const [wireframe, setWireframe] = useState(false)
  const [autoRotate, setAutoRotate] = useState(false)
  const [bgColor, setBgColor] = useState('#111111')
  const [showAxes, setShowAxes] = useState(false)
  const [lightingPreset, setLightingPreset] = useState('neutral')
  const [sunIntensity, setSunIntensity] = useState(1)
  const [sunRotation, setSunRotation] = useState(45)
  const [focusTrigger, setFocusTrigger] = useState(0)
  const initialFocusPendingRef = useRef(true)
  const [showPoiList, setShowPoiList] = useState(true)
  const [flash, setFlash] = useState(false)
  const [showMeta, setShowMeta] = useState(false)
  const [showWikiSidebar, setShowWikiSidebar] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [draftSettings, setDraftSettings] = useState({ showGrid: true, showAxes: false, autoRotate: false, lightingPreset: 'neutral', backgroundColor: '#111111', sunIntensity: 1, sunRotation: 45 })
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
    setIsOwner(false)
    setFocusTrigger(0)
    setShowSettingsPanel(false)
    modelRef.current = null
    initialFocusPendingRef.current = true

    const headers = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const url = `${API}/models/${id}${searchParams.toString() ? '?' + searchParams.toString() : ''}`
    fetch(url, { headers })
      .then((r) => { if (!r.ok) throw new Error(r.status === 403 ? 'Private model' : 'Not found'); return r.json() })
      .then((data) => {
        setModel(data)
        setIsOwner(Boolean(token) && data.userId === (() => {
          try { return JSON.parse(atob(token.split('.')[1])).userId } catch { return null }
        })())
        setPois((data.pois || []).map(normalizePoi))
        setBacklinks(data.backlinks || [])
        // Apply stored viewer settings
        let vs = {}
        try { vs = JSON.parse(data.viewerSettings || '{}') } catch { vs = {} }
        if (typeof vs.showGrid === 'boolean') setShowGrid(vs.showGrid)
        if (typeof vs.autoRotate === 'boolean') setAutoRotate(vs.autoRotate)
        if (typeof vs.showAxes === 'boolean') setShowAxes(vs.showAxes)
        if (vs.backgroundColor) setBgColor(vs.backgroundColor)
        if (vs.lightingPreset) setLightingPreset(vs.lightingPreset)
        if (typeof vs.sunIntensity === 'number') setSunIntensity(vs.sunIntensity)
        if (typeof vs.sunRotation === 'number') setSunRotation(vs.sunRotation)
        setDraftSettings({
          showGrid: typeof vs.showGrid === 'boolean' ? vs.showGrid : true,
          showAxes: typeof vs.showAxes === 'boolean' ? vs.showAxes : false,
          autoRotate: typeof vs.autoRotate === 'boolean' ? vs.autoRotate : false,
          lightingPreset: vs.lightingPreset || 'neutral',
          backgroundColor: vs.backgroundColor || '#111111',
          sunIntensity: typeof vs.sunIntensity === 'number' ? vs.sunIntensity : 1,
          sunRotation: typeof vs.sunRotation === 'number' ? vs.sunRotation : 45
        })
        // Breadcrumbs: append current model to trail, avoiding loops
        const trail = JSON.parse(sessionStorage.getItem('modelBreadcrumbs') || '[]')
        const existingIdx = trail.findIndex(b => b.id === data.id)
        let newTrail
        if (existingIdx >= 0) {
          newTrail = trail.slice(0, existingIdx + 1)
        } else {
          newTrail = [...trail, { id: data.id, title: data.title }]
          if (newTrail.length > 8) newTrail = newTrail.slice(-8)
        }
        sessionStorage.setItem('modelBreadcrumbs', JSON.stringify(newTrail))
        setBreadcrumbs(newTrail)
        // Track recently viewed
        const recent = JSON.parse(localStorage.getItem('recentModels') || '[]')
        const next = [{ id: data.id, title: data.title, extension: data.originalName?.split('.').pop() }, ...recent.filter(m => m.id !== data.id)].slice(0, 6)
        localStorage.setItem('recentModels', JSON.stringify(next))
      })
      .catch((err) => setError(err.message))

    if (token) {
      fetch(`${API}/models/mine`, { headers })
        .then(r => r.json())
        .then(setMyModels)
    }

    // Fetch related models
    fetch(`${API}/models/${id}/related${searchParams.toString() ? '?' + searchParams.toString() : ''}`, { headers })
      .then(r => r.ok ? r.json() : [])
      .then(setRelatedModels)
      .catch(() => setRelatedModels([]))
  }, [id, searchParams, token])

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      switch (e.key.toLowerCase()) {
        case 'escape':
          setAddingPoi(null)
          setEditingPoi(null)
          setSelectedPoi(null)
          setPoiForm({ title: '', content: '', type: 'text' })
          setShowHelp(false)
          setShowSettingsPanel(false)
          break
        case 'f':
          setFocusTrigger((n) => n + 1)
          break
        case 'r':
          if (controlsRef.current) { controlsRef.current.reset(); controlsRef.current.target.set(0, 0, 0); controlsRef.current.update() }
          break
        case 'g':
          setShowGrid((v) => !v)
          break
        case 'w':
          setWireframe((v) => !v)
          break
        case 'a':
          setAutoRotate((v) => !v)
          break
        case 's':
          handleScreenshot()
          break
        case 'b':
          setBgColor((c) => c === '#111111' ? '#e8e8e8' : '#111111')
          break
        case 'h':
          setShowHelp((v) => !v)
          break
        case 'n':
          if (selectedPoi) {
            const currentIdx = pois.findIndex(p => p.id === selectedPoi.id)
            if (currentIdx >= 0 && currentIdx < pois.length - 1) setSelectedPoi(pois[currentIdx + 1])
          } else if (pois[0]) setSelectedPoi(pois[0])
          break
        case 'p':
          if (selectedPoi) {
            const currentIdx = pois.findIndex(p => p.id === selectedPoi.id)
            if (currentIdx > 0) setSelectedPoi(pois[currentIdx - 1])
          }
          break
        case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9': {
          const idx = parseInt(e.key, 10) - 1
          if (pois[idx]) {
            setSelectedPoi(pois[idx])
            setAddingPoi(null)
            setEditingPoi(null)
          }
          break
        }
        default:
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [pois, selectedPoi])

  const handleFocusDone = useCallback(() => {}, [])

  const handleModelReady = useCallback((obj) => {
    modelRef.current = obj
    if (initialFocusPendingRef.current) {
      initialFocusPendingRef.current = false
      setFocusTrigger((n) => n + 1)
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
    setFocusTrigger((n) => n + 1)
  }, [])

  const submitPoi = async () => {
    const res = await fetch(`${API}/pois`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        modelId: id,
        position: addingPoi,
        title: poiForm.title,
        content: poiForm.content,
        type: poiForm.type,
        nestedModelId: poiForm.type === 'nested-model' ? poiForm.content : null
      })
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
      body: JSON.stringify({
        title: poiForm.title,
        content: poiForm.content,
        type: poiForm.type,
        nestedModelId: poiForm.type === 'nested-model' ? poiForm.content : null
      })
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

  const handleSaveSettings = async () => {
    if (!isOwner) return
    setSettingsSaving(true)
    const res = await fetch(`${API}/models/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ viewerSettings: JSON.stringify(draftSettings) })
    })
    if (res.ok) {
      // Apply immediately
      setShowGrid(draftSettings.showGrid)
      setShowAxes(draftSettings.showAxes)
      setAutoRotate(draftSettings.autoRotate)
      setLightingPreset(draftSettings.lightingPreset)
      setBgColor(draftSettings.backgroundColor)
      setSunIntensity(draftSettings.sunIntensity)
      setSunRotation(draftSettings.sunRotation)
      setModel(prev => ({ ...prev, viewerSettings: JSON.stringify(draftSettings) }))
      setShowSettingsPanel(false)
    }
    setSettingsSaving(false)
  }

  const handleOpenSettings = () => {
    // Reset draft to current active settings
    setDraftSettings({
      showGrid,
      showAxes,
      autoRotate,
      lightingPreset,
      backgroundColor: bgColor,
      sunIntensity,
      sunRotation,
    })
    setShowSettingsPanel(v => !v)
  }

  if (error) return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--danger)', zIndex: 100 }}>
      {error}
    </div>
  )
  if (!model) return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-muted)', zIndex: 100 }}>
      Loading...
    </div>
  )

  const extension = model.originalName?.split('.').pop()
  const isSupported = SUPPORTED_FORMATS.includes(extension?.toLowerCase())
  const modelUrl = isSupported && model.filename ? `${API.replace('/api', '')}/uploads/${model.filename}` : null

  const overlayBg = 'rgba(255, 255, 255, 0.96)'
  const panelStyle = {
    background: overlayBg,
    border: '1px solid #e5e5e5',
    borderRadius: '10px',
    backdropFilter: 'blur(6px)',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: bgColor, zIndex: 100 }}>
      {/* Screenshot flash */}
      {flash && (
        <div style={{ position: 'fixed', inset: 0, background: 'white', opacity: 0.3, pointerEvents: 'none', zIndex: 9999, animation: 'flashOut 0.3s ease forwards' }} />
      )}

      {/* Full viewport canvas */}
      <div ref={canvasContainerRef} style={{ position: 'absolute', inset: 0 }}>
        <Canvas camera={{ position: [4, 4, 4], fov: 50 }} style={{ width: '100%', height: '100%' }} gl={{ preserveDrawingBuffer: true }}>
          <color attach="background" args={[bgColor]} />
          <SceneContent modelUrl={modelUrl} extension={extension} pois={pois} selectedPoi={selectedPoi} onPoiClick={handlePoiClick} onAddPoi={handleAddPoi} modelRef={modelRef} showGrid={showGrid} wireframe={wireframe} autoRotate={autoRotate} controlsRef={controlsRef} focusTrigger={focusTrigger} onFocusDone={handleFocusDone} onModelReady={handleModelReady} showAxes={showAxes} lightingPreset={lightingPreset} sunIntensity={sunIntensity} sunRotation={sunRotation} />
        </Canvas>
      </div>

      {/* Top overlay bar */}
      <ModelHeader
        model={model}
        breadcrumbs={breadcrumbs}
        mode="viewer"
        onOpenViewer={() => {}}
        onOpenWiki={() => navigate(`/model/${id}/wiki`)}
        extraButtons={(
          <div style={{ pointerEvents: 'auto', display: 'flex', gap: '2px', ...panelStyle, padding: '4px' }}>
            {[
              { icon: controlIcons.focus, onClick: handleFocus, title: 'Focus' },
              { icon: controlIcons.reset, onClick: handleReset, title: 'Reset' },
            ].map((c, i) => (
              <button key={i} onClick={c.onClick} title={c.title} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: '6px', color: '#888888', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.06)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>{c.icon}</button>
            ))}
            <div style={{ width: '1px', background: 'rgba(0,0,0,0.06)', margin: '4px 2px' }} />
            {[
              { icon: controlIcons.grid, onClick: () => setShowGrid(!showGrid), active: showGrid, title: 'Grid' },
              { icon: controlIcons.wireframe, onClick: () => setWireframe(!wireframe), active: wireframe, title: 'Wireframe' },
              { icon: controlIcons.rotate, onClick: () => setAutoRotate(!autoRotate), active: autoRotate, title: 'Auto-Rotate' },
              { icon: controlIcons.bg, onClick: () => setBgColor(bgColor === '#111111' ? '#e8e8e8' : '#111111'), active: bgColor === '#111111', title: 'Background' },
            ].map((c, i) => (
              <button key={i} onClick={c.onClick} title={c.title} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.active ? '#fee2e2' : 'transparent', border: 'none', borderRadius: '6px', color: c.active ? 'var(--primary)' : '#888888', cursor: 'pointer' }} onMouseEnter={e => { if (!c.active) e.currentTarget.style.background = 'rgba(0,0,0,0.06)' }} onMouseLeave={e => { if (!c.active) e.currentTarget.style.background = 'transparent' }}>{c.icon}</button>
            ))}
            <div style={{ width: '1px', background: 'rgba(0,0,0,0.06)', margin: '4px 2px' }} />
            {[
              { icon: controlIcons.screenshot, onClick: handleScreenshot, title: 'Screenshot (S)' },
              { icon: controlIcons.fullscreen, onClick: handleFullscreen, title: 'Fullscreen' },
            ].map((c, i) => (
              <button key={i} onClick={c.onClick} title={c.title} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: '6px', color: '#888888', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.06)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>{c.icon}</button>
            ))}
            <div style={{ width: '1px', background: 'rgba(0,0,0,0.06)', margin: '4px 2px' }} />
            {isOwner && (
              <button
                onClick={handleOpenSettings}
                title="Viewer Settings"
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: showSettingsPanel ? '#fee2e2' : 'transparent', border: 'none', borderRadius: '6px', color: showSettingsPanel ? 'var(--primary)' : '#888888', cursor: 'pointer' }}
                onMouseEnter={e => { if (!showSettingsPanel) e.currentTarget.style.background = 'rgba(0,0,0,0.06)' }}
                onMouseLeave={e => { if (!showSettingsPanel) e.currentTarget.style.background = 'transparent' }}
              >
                {controlIcons.settings}
              </button>
            )}
            <button onClick={() => setShowWikiSidebar(v => !v)} title="Toggle Wiki Sidebar" style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: showWikiSidebar ? '#fee2e2' : 'transparent', border: 'none', borderRadius: '6px', color: showWikiSidebar ? 'var(--primary)' : '#888888', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }} onMouseEnter={e => { if (!showWikiSidebar) e.currentTarget.style.background = 'rgba(0,0,0,0.06)' }} onMouseLeave={e => { if (!showWikiSidebar) e.currentTarget.style.background = 'transparent' }}>W</button>
            <button onClick={() => setShowHelp(true)} title="Keyboard Shortcuts (H)" style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: '6px', color: '#888888', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.06)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>?</button>
          </div>
        )}
      />

      {/* Settings dropdown panel */}
      {showSettingsPanel && isOwner && (
        <div style={{ position: 'absolute', top: 56, right: 16, zIndex: 30, ...panelStyle, padding: 0 }}>
          <SettingsPanel
            settings={draftSettings}
            onChange={setDraftSettings}
            onSave={handleSaveSettings}
            onCancel={() => setShowSettingsPanel(false)}
            saving={settingsSaving}
            isOwner={isOwner}
          />
        </div>
      )}

      {/* Format warning */}
      {!isSupported && (
        <div style={{ position: 'absolute', top: 68, left: '50%', transform: 'translateX(-50%)', zIndex: 20, ...panelStyle, padding: '8px 14px', background: '#fef2f2' }}>
          <p style={{ color: '#b91c1c', fontSize: '0.8rem' }}><strong>Format not supported for viewing yet.</strong> Supported: GLTF, GLB, OBJ, FBX, STL.</p>
        </div>
      )}

      {/* Wiki sidebar */}
      {showWikiSidebar && (
        <div style={{ position: 'absolute', top: 80, right: 16, bottom: 16, width: 300, overflow: 'auto', zIndex: 20 }}>
          <div style={{ ...panelStyle, padding: '1rem', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M13 2v8h8v2h-8v8h-2v-8H3v-2h8V2z"/></svg>
              Wiki
            </h3>
            {model.wikiContent ? (
              <div style={{ maxHeight: '40vh', overflow: 'auto' }}>
                <MarkdownContent content={model.wikiContent} />
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>No wiki yet. <Link to={`/model/${id}/wiki`} style={{ color: 'var(--primary)' }}>Write one</Link>.</p>
            )}
          </div>
        </div>
      )}

      {/* Left side panel */}
      {showPoiList && (
        <div style={{ position: 'absolute', top: 80, left: 16, bottom: 16, overflow: 'hidden', zIndex: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', ...panelStyle, padding: '1rem' }}>
            {/* Title */}
            <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Points of Interest
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.5rem' }}>({pois.length})</span>
            </h3>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: 'calc(100vh - 240px)', overflow: 'auto' }}>
              {pois.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem 0' }}>Double-click on the model to add a point of interest.</p>
              )}
              {pois.map((poi, idx) => (
                <button
                  key={poi.id}
                  onClick={() => handlePoiClick(poi)}
                  style={{
                    textAlign: 'left',
                    background: selectedPoi?.id === poi.id ? 'var(--primary)' : 'rgba(0,0,0,0.02)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    color: selectedPoi?.id === poi.id ? 'white' : 'var(--text-primary)',
                    transition: 'all 0.2s ease',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                  }}
                  onMouseEnter={e => { if (selectedPoi?.id !== poi.id) e.currentTarget.style.background = 'var(--primary)'; if (selectedPoi?.id !== poi.id) e.currentTarget.style.color = 'white' }}
                  onMouseLeave={e => { if (selectedPoi?.id !== poi.id) e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; if (selectedPoi?.id !== poi.id) e.currentTarget.style.color = 'var(--text-primary)' }}
                >
                  <span style={{ color: selectedPoi?.id === poi.id ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', fontSize: '0.65rem', marginRight: '0.3rem' }}>{idx + 1}.</span>
                  {poi.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* POI detail / form panel */}
      {(selectedPoi || addingPoi || editingPoi) && (
        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', width: 320, zIndex: 20 }}>
          <div style={{ ...panelStyle, padding: '1rem' }}>
            {selectedPoi && !editingPoi && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedPoi.title}</h3>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.04)', padding: '2px 6px', borderRadius: '4px' }}>{selectedPoi.type}</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, maxHeight: '30vh', overflow: 'auto' }}>
                  {selectedPoi.type === 'nested-model' && selectedPoi.content ? (
                    <button onClick={() => navigate(`/model/${selectedPoi.content}`)} className="btn" style={{ width: '100%' }}>Open Nested Model</button>
                  ) : (
                    <MarkdownContent content={selectedPoi.content} />
                  )}
                </div>
                {isOwner && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => startEditPoi(selectedPoi)} style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #e5e5e5', background: 'white', cursor: 'pointer' }}>Edit</button>
                    <button onClick={deletePoi} style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#b91c1c', cursor: 'pointer' }}>Delete</button>
                  </div>
                )}
              </div>
            )}
            {addingPoi && (
              <PoiForm
                title=""
                content=""
                type="text"
                onTitleChange={(v) => setPoiForm(p => ({ ...p, title: v }))}
                onContentChange={(v) => setPoiForm(p => ({ ...p, content: v }))}
                onTypeChange={(v) => setPoiForm(p => ({ ...p, type: v }))}
                onSave={submitPoi}
                onCancel={() => setAddingPoi(null)}
                myModels={myModels}
                currentModelId={id}
              />
            )}
            {editingPoi && (
              <PoiForm
                title={poiForm.title}
                content={poiForm.content}
                type={poiForm.type}
                onTitleChange={(v) => setPoiForm(p => ({ ...p, title: v }))}
                onContentChange={(v) => setPoiForm(p => ({ ...p, content: v }))}
                onTypeChange={(v) => setPoiForm(p => ({ ...p, type: v }))}
                onSave={saveEditPoi}
                onCancel={() => { setEditingPoi(null); setPoiForm({ title: '', content: '', type: 'text' }) }}
                onDelete={deletePoi}
                deleteLabel="Delete"
                myModels={myModels}
                currentModelId={id}
              />
            )}
          </div>
        </div>
      )}

      {/* Help modal */}
      {showHelp && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', maxWidth: 420, width: '90%' }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600 }}>Keyboard Shortcuts</h2>
            <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.85rem' }}>
              {[
                ['F', 'Focus model'],
                ['R', 'Reset camera'],
                ['G', 'Toggle grid'],
                ['W', 'Toggle wireframe'],
                ['A', 'Toggle auto-rotate'],
                ['S', 'Screenshot'],
                ['B', 'Toggle background'],
                ['N / P', 'Next / Previous POI'],
                ['1-9', 'Select POI'],
                ['H', 'Toggle help'],
                ['Esc', 'Close / Deselect'],
              ].map(([k, d]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', background: 'rgba(185,28,28,0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>{k}</span>
                  <span>{d}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowHelp(false)} style={{ marginTop: '1rem', width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e5e5', background: 'white', cursor: 'pointer', fontSize: '0.85rem' }}>Close</button>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 20, display: 'flex', gap: '0.5rem' }}>
        {relatedModels.length > 0 && (
          <button onClick={() => setShowRelated(v => !v)} style={{ ...panelStyle, padding: '8px 14px', fontSize: '0.78rem', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,255,255,0.96)' }}>
            Related Models ({relatedModels.length})
          </button>
        )}
        <button onClick={() => setShowMeta(v => !v)} style={{ ...panelStyle, padding: '8px 14px', fontSize: '0.78rem', cursor: 'pointer', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.96)' }}>
          {showMeta ? 'Hide' : 'Show'} Metadata
        </button>
      </div>

      {/* Metadata panel */}
      {showMeta && (
        <div style={{ position: 'absolute', bottom: 60, right: 16, zIndex: 20, ...panelStyle, padding: '1rem', width: 260 }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Metadata</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <MetaRow label="Format" value={extension?.toUpperCase()} />
            <MetaRow label="Size" value={formatBytes(model.size)} />
            <MetaRow label="Points of Interest" value={pois.length} />
            <MetaRow label="Published" value={model.published ? 'Yes' : 'No'} />
          </div>
        </div>
      )}

      {/* Related models panel */}
      {showRelated && relatedModels.length > 0 && (
        <div style={{ position: 'absolute', bottom: 60, right: 16, zIndex: 20, ...panelStyle, padding: '1rem', width: 300, maxHeight: 300, overflow: 'auto' }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Related Models</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {relatedModels.map((m) => (
              <Link key={m.id} to={`/model/${m.id}`} style={{ display: 'block', padding: '0.5rem', borderRadius: '6px', textDecoration: 'none', color: 'var(--text-primary)', background: 'rgba(0,0,0,0.02)', fontSize: '0.8rem' }}>
                <div style={{ fontWeight: 600 }}>{m.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{m.sharedTags?.length > 0 && `${m.sharedTags.length} shared tag${m.sharedTags.length > 1 ? 's' : ''}`}{m.sharedTerms?.length > 0 && ` · ${m.sharedTerms.length} term${m.sharedTerms.length > 1 ? 's' : ''}`}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ModelViewer

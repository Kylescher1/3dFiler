import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, Box } from '@react-three/drei'
import * as THREE from 'three'
import { ModelRenderer, SUPPORTED_FORMATS } from '../components/ModelRenderer'
import { POIMarker } from '../components/POIMarker'
import { SceneControls } from '../components/SceneControls'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function normalizePoi(poi) {
  // Prisma stores positions as positionX/Y/Z, but frontend expects position: {x,y,z}
  if (poi.positionX !== undefined) {
    return {
      ...poi,
      position: { x: poi.positionX, y: poi.positionY, z: poi.positionZ }
    }
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
      if (modelRef.current) {
        targets.push(modelRef.current)
      }
      if (planeRef.current) {
        targets.push(planeRef.current)
      }
      const intersects = raycaster.current.intersectObjects(targets, true)
      if (intersects.length > 0) {
        onClick(intersects[0].point)
      }
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
        mats.forEach((mat) => {
          mat.wireframe = wireframe
        })
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

    const endPos = new THREE.Vector3(
      center.x + distance * 0.7,
      center.y + distance * 0.5,
      center.z + distance * 0.7
    )

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

function SceneContent({
  modelUrl,
  extension,
  pois,
  selectedPoi,
  onPoiClick,
  onAddPoi,
  modelRef,
  showGrid,
  wireframe,
  autoRotate,
  controlsRef,
  focusTrigger,
  onFocusDone,
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.4} />
      <pointLight position={[0, -5, 0]} intensity={0.2} />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        autoRotate={autoRotate}
        autoRotateSpeed={1.2}
        minDistance={0.5}
        maxDistance={50}
      />

      {showGrid && <Grid args={[20, 20]} position={[0, -0.01, 0]} />}
      <ClickPlane onClick={onAddPoi} modelRef={modelRef} />

      <group ref={modelRef}>
        {modelUrl ? (
          <ModelRenderer
            url={modelUrl}
            extension={extension}
            onReady={(obj) => {
              modelRef.current = obj
            }}
          />
        ) : (
          <Box args={[1, 1, 1]} position={[0, 0.5, 0]}>
            <meshStandardMaterial color="#333" wireframe />
          </Box>
        )}
      </group>

      <WireframeToggle modelRef={modelRef} wireframe={wireframe} />
      <CameraFocus controlsRef={controlsRef} targetRef={modelRef} trigger={focusTrigger} onDone={onFocusDone} />

      {pois.map((poi) => (
        <POIMarker
          key={poi.id}
          position={poi.position}
          title={poi.title}
          selected={selectedPoi?.id === poi.id}
          onClick={() => onPoiClick(poi)}
        />
      ))}
    </>
  )
}

function ModelViewer() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [model, setModel] = useState(null)
  const [pois, setPois] = useState([])
  const [selectedPoi, setSelectedPoi] = useState(null)
  const [addingPoi, setAddingPoi] = useState(null)
  const [poiForm, setPoiForm] = useState({ title: '', content: '', type: 'text' })
  const [error, setError] = useState('')
  const [showGrid, setShowGrid] = useState(true)
  const [wireframe, setWireframe] = useState(false)
  const [autoRotate, setAutoRotate] = useState(false)
  const [bgDark, setBgDark] = useState(true)
  const [focusTrigger, setFocusTrigger] = useState(0)
  const [initialFocusDone, setInitialFocusDone] = useState(false)
  const controlsRef = useRef()
  const modelRef = useRef(null)
  const canvasContainerRef = useRef(null)
  const token = localStorage.getItem('token')

  useEffect(() => {
    const headers = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const url = `${API}/models/${id}${searchParams.toString() ? '?' + searchParams.toString() : ''}`

    fetch(url, { headers })
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? 'Private model' : 'Not found')
        return r.json()
      })
      .then((data) => {
        setModel(data)
        setPois((data.pois || []).map(normalizePoi))
      })
      .catch((err) => setError(err.message))
  }, [id, searchParams, token])

  // Escape key cancels POI creation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        setAddingPoi(null)
        setSelectedPoi(null)
        setPoiForm({ title: '', content: '', type: 'text' })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Click outside POI list deselects
  const handleCanvasClick = (e) => {
    // If click is directly on canvas container (not on a POI or control), deselect
    if (e.target === canvasContainerRef.current || e.target.tagName === 'CANVAS') {
      setSelectedPoi(null)
    }
  }
  useEffect(() => {
    if (initialFocusDone) return
    // We need the model to be rendered before we can focus
    // ModelRenderer calls onReady when the mesh is ready
    // We'll use a small timeout to let the scene settle, then trigger focus
    const timer = setTimeout(() => {
      if (modelRef.current) {
        setFocusTrigger((n) => n + 1)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [model, initialFocusDone])

  const handleFocusDone = useCallback(() => {
    setInitialFocusDone(true)
  }, [])

  const handleAddPoi = useCallback((point) => {
    setAddingPoi({ x: point.x, y: point.y, z: point.z })
  }, [])

  const submitPoi = async () => {
    const res = await fetch(`${API}/pois`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        modelId: id,
        position: addingPoi,
        title: poiForm.title,
        content: poiForm.content,
        type: poiForm.type,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setPois((prev) => [...prev, normalizePoi(data)])
      setAddingPoi(null)
      setPoiForm({ title: '', content: '', type: 'text' })
    }
  }

  const handleScreenshot = () => {
    const canvas = canvasContainerRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `3dFiler-${model?.title || 'screenshot'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const handleFullscreen = () => {
    const el = canvasContainerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset()
      controlsRef.current.target.set(0, 0, 0)
      controlsRef.current.update()
    }
  }

  const handleFocus = () => {
    setFocusTrigger((n) => n + 1)
  }

  if (error)
    return (
      <div className="card" style={{ color: '#ef5350', textAlign: 'center', marginTop: '3rem' }}>
        {error}
      </div>
    )
  if (!model)
    return (
      <div className="card" style={{ textAlign: 'center', marginTop: '3rem' }}>
        Loading...
      </div>
    )

  const extension = model.originalName?.split('.').pop()
  const isSupported = SUPPORTED_FORMATS.includes(extension?.toLowerCase())
  const modelUrl =
    isSupported && model.filename ? `${API.replace('/api', '')}/uploads/${model.filename}` : null

  return (
    <div>
      <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
        {model.title}
      </h1>
      <p style={{ color: '#888', marginBottom: '1rem' }}>{model.description}</p>

      {!isSupported && (
        <div className="card" style={{ marginBottom: '1rem', background: '#3e2723', borderColor: '#5d4037' }}>
          <p style={{ color: '#ffab91' }}>
            <strong>Format not supported for viewing yet.</strong> Supported formats: GLTF, GLB, OBJ, FBX, STL.
            You can still add points of interest on the placeholder below.
          </p>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: '1rem',
          height: '600px',
        }}
      >
        <div
          ref={canvasContainerRef}
          onClick={handleCanvasClick}
          className="card"
          style={{
            padding: 0,
            overflow: 'hidden',
            position: 'relative',
            background: bgDark ? '#0a0a0a' : '#e8e8e8',
          }}
        >
          <Canvas
            camera={{ position: [4, 4, 4], fov: 50 }}
            style={{ width: '100%', height: '100%' }}
            gl={{ preserveDrawingBuffer: true }}
          >
            <color attach="background" args={[bgDark ? '#0a0a0a' : '#e8e8e8']} />
            <SceneContent
              modelUrl={modelUrl}
              extension={extension}
              pois={pois}
              selectedPoi={selectedPoi}
              onPoiClick={setSelectedPoi}
              onAddPoi={handleAddPoi}
              modelRef={modelRef}
              showGrid={showGrid}
              wireframe={wireframe}
              autoRotate={autoRotate}
              controlsRef={controlsRef}
              focusTrigger={focusTrigger}
              onFocusDone={handleFocusDone}
            />
          </Canvas>

          <SceneControls
            onFocus={handleFocus}
            onReset={handleReset}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            wireframe={wireframe}
            setWireframe={setWireframe}
            autoRotate={autoRotate}
            setAutoRotate={setAutoRotate}
            onScreenshot={handleScreenshot}
            onFullscreen={handleFullscreen}
            bgDark={bgDark}
            setBgDark={setBgDark}
            controlsRef={controlsRef}
          />

          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.7)',
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: '#888',
              pointerEvents: 'none',
            }}
          >
            Double-click to add a point of interest
          </div>
        </div>

        <div>
          {addingPoi && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3 style={{ color: '#4fc3f7', marginBottom: '0.75rem', fontSize: '1rem' }}>
                New Point of Interest
              </h3>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={poiForm.title}
                  onChange={(e) => setPoiForm({ ...poiForm, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={poiForm.type}
                  onChange={(e) => setPoiForm({ ...poiForm, type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: '#111',
                    color: '#e0e0e0',
                    border: '1px solid #2a2a2a',
                    borderRadius: '6px',
                  }}
                >
                  <option value="text">Text</option>
                  <option value="nested-model">Nested Model</option>
                </select>
              </div>
              <div className="form-group">
                <label>{poiForm.type === 'text' ? 'Content' : 'Nested Model ID'}</label>
                <textarea
                  rows={poiForm.type === 'text' ? 3 : 1}
                  value={poiForm.content}
                  onChange={(e) => setPoiForm({ ...poiForm, content: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={submitPoi} className="btn" style={{ flex: 1, padding: '0.4rem' }}>
                  Save
                </button>
                <button
                  onClick={() => setAddingPoi(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '0.4rem' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {selectedPoi && !addingPoi && (
            <div className="card">
              <h3 style={{ color: '#4fc3f7', marginBottom: '0.5rem', fontSize: '1rem' }}>
                {selectedPoi.title}
              </h3>
              <p style={{ color: '#ccc', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                {selectedPoi.content}
              </p>
              <p style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                Type: {selectedPoi.type}
              </p>
            </div>
          )}

          <div className="card">
            <h3 style={{ color: '#4fc3f7', marginBottom: '0.75rem', fontSize: '1rem' }}>
              Points of Interest ({pois.length})
            </h3>
            {pois.length === 0 ? (
              <p style={{ color: '#666', fontSize: '0.85rem' }}>
                No POIs yet. Double-click on the model to add one.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {pois.map((poi) => (
                  <button
                    key={poi.id}
                    onClick={() => setSelectedPoi(poi)}
                    style={{
                      textAlign: 'left',
                      padding: '0.5rem',
                      background: selectedPoi?.id === poi.id ? '#1e3a4c' : '#111',
                      border: '1px solid #2a2a2a',
                      borderRadius: '4px',
                      color: '#ccc',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ color: '#4fc3f7', fontWeight: 600 }}>{poi.title}</span>
                    <span style={{ color: '#666', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                      {poi.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModelViewer

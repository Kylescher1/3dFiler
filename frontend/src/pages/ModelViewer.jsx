import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, Box } from '@react-three/drei'
import * as THREE from 'three'
import { ModelRenderer, SUPPORTED_FORMATS } from '../components/ModelRenderer'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function POIMarker({ position, onClick, selected }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = position.y + Math.sin(clock.getElapsedTime() * 2) * 0.05 + 0.1
    }
  })
  return (
    <mesh ref={ref} position={[position.x, position.y, position.z]} onClick={onClick}>
      <sphereGeometry args={[0.05, 16, 16]} />
      <meshStandardMaterial color={selected ? '#ef5350' : '#4fc3f7'} emissive={selected ? '#ef5350' : '#4fc3f7'} emissiveIntensity={0.5} />
    </mesh>
  )
}

function ClickPlane({ onClick, targetsRef }) {
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

      // Try to intersect with the loaded model first, then fall back to ground plane
      const targets = targetsRef.current?.length ? targetsRef.current : [planeRef.current]
      const intersects = raycaster.current.intersectObjects(targets, true)
      if (intersects.length > 0) {
        onClick(intersects[0].point)
      }
    }
    gl.domElement.addEventListener('dblclick', handler)
    return () => gl.domElement.removeEventListener('dblclick', handler)
  }, [camera, gl, onClick, targetsRef])

  return (
    <mesh ref={planeRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} visible={false}>
      <planeGeometry args={[50, 50]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  )
}

function SceneContent({ modelUrl, extension, pois, selectedPoi, onPoiClick, onAddPoi, modelRef }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.4} />
      <OrbitControls makeDefault />
      <Grid args={[20, 20]} position={[0, -0.01, 0]} />
      <ClickPlane onClick={onAddPoi} targetsRef={modelRef} />

      <group ref={modelRef}>
        {modelUrl ? (
          <ModelRenderer url={modelUrl} extension={extension} />
        ) : (
          <Box args={[1, 1, 1]} position={[0, 0.5, 0]}>
            <meshStandardMaterial color="#333" wireframe />
          </Box>
        )}
      </group>

      {pois.map(poi => (
        <POIMarker
          key={poi.id}
          position={poi.position}
          selected={selectedPoi?.id === poi.id}
          onClick={(e) => { e.stopPropagation(); onPoiClick(poi) }}
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
  const modelRef = useRef(null)
  const token = localStorage.getItem('token')

  useEffect(() => {
    const headers = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const url = `${API}/models/${id}${searchParams.toString() ? '?' + searchParams.toString() : ''}`

    fetch(url, { headers })
      .then(r => {
        if (!r.ok) throw new Error(r.status === 403 ? 'Private model' : 'Not found')
        return r.json()
      })
      .then(data => {
        setModel(data)
        setPois(data.pois || [])
      })
      .catch(err => setError(err.message))
  }, [id, searchParams, token])

  const handleAddPoi = useCallback((point) => {
    setAddingPoi({ x: point.x, y: point.y, z: point.z })
  }, [])

  const submitPoi = async () => {
    const res = await fetch(`${API}/pois`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        modelId: id,
        position: addingPoi,
        title: poiForm.title,
        content: poiForm.content,
        type: poiForm.type
      })
    })
    const data = await res.json()
    if (res.ok) {
      setPois([...pois, data])
      setAddingPoi(null)
      setPoiForm({ title: '', content: '', type: 'text' })
    }
  }

  if (error) return <div className="card" style={{ color: '#ef5350', textAlign: 'center', marginTop: '3rem' }}>{error}</div>
  if (!model) return <div className="card" style={{ textAlign: 'center', marginTop: '3rem' }}>Loading...</div>

  const extension = model.originalName?.split('.').pop()
  const isSupported = SUPPORTED_FORMATS.includes(extension?.toLowerCase())
  const modelUrl = isSupported && model.filename
    ? `${API.replace('/api', '')}/uploads/${model.filename}`
    : null

  return (
    <div>
      <h1 className="page-title" style={{ fontSize: '1.5rem' }}>{model.title}</h1>
      <p style={{ color: '#888', marginBottom: '1rem' }}>{model.description}</p>

      {!isSupported && (
        <div className="card" style={{ marginBottom: '1rem', background: '#3e2723', borderColor: '#5d4037' }}>
          <p style={{ color: '#ffab91' }}>
            <strong>Format not supported for viewing yet.</strong> Supported formats: GLTF, GLB, OBJ, FBX, STL.
            You can still add points of interest on the placeholder below.
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1rem', height: '600px' }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
          <Canvas camera={{ position: [3, 3, 3], fov: 50 }} style={{ width: '100%', height: '100%' }}>
            <SceneContent
              modelUrl={modelUrl}
              extension={extension}
              pois={pois}
              selectedPoi={selectedPoi}
              onPoiClick={setSelectedPoi}
              onAddPoi={handleAddPoi}
              modelRef={modelRef}
            />
          </Canvas>
          <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', color: '#888', pointerEvents: 'none' }}>
            Double-click to add a point of interest
          </div>
        </div>

        <div>
          {addingPoi && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3 style={{ color: '#4fc3f7', marginBottom: '0.75rem', fontSize: '1rem' }}>New Point of Interest</h3>
              <div className="form-group">
                <label>Title</label>
                <input type="text" value={poiForm.title} onChange={e => setPoiForm({ ...poiForm, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={poiForm.type} onChange={e => setPoiForm({ ...poiForm, type: e.target.value })} style={{ width: '100%', padding: '0.5rem', background: '#111', color: '#e0e0e0', border: '1px solid #2a2a2a', borderRadius: '6px' }}>
                  <option value="text">Text</option>
                  <option value="nested-model">Nested Model</option>
                </select>
              </div>
              <div className="form-group">
                <label>{poiForm.type === 'text' ? 'Content' : 'Nested Model ID'}</label>
                <textarea rows={poiForm.type === 'text' ? 3 : 1} value={poiForm.content} onChange={e => setPoiForm({ ...poiForm, content: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={submitPoi} className="btn" style={{ flex: 1, padding: '0.4rem' }}>Save</button>
                <button onClick={() => setAddingPoi(null)} className="btn btn-secondary" style={{ flex: 1, padding: '0.4rem' }}>Cancel</button>
              </div>
            </div>
          )}

          {selectedPoi && !addingPoi && (
            <div className="card">
              <h3 style={{ color: '#4fc3f7', marginBottom: '0.5rem', fontSize: '1rem' }}>{selectedPoi.title}</h3>
              <p style={{ color: '#ccc', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{selectedPoi.content}</p>
              <p style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.5rem' }}>Type: {selectedPoi.type}</p>
            </div>
          )}

          <div className="card">
            <h3 style={{ color: '#4fc3f7', marginBottom: '0.75rem', fontSize: '1rem' }}>Points of Interest ({pois.length})</h3>
            {pois.length === 0 ? (
              <p style={{ color: '#666', fontSize: '0.85rem' }}>No POIs yet. Double-click on the model to add one.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {pois.map(poi => (
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
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ color: '#4fc3f7', fontWeight: 600 }}>{poi.title}</span>
                    <span style={{ color: '#666', fontSize: '0.75rem', marginLeft: '0.5rem' }}>{poi.type}</span>
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

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function Upload() {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const navigate = useNavigate()

  const handleFile = (f) => {
    if (!f) return
    const valid = ['.gltf', '.glb', '.obj', '.fbx', '.stl']
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase()
    if (!valid.includes(ext)) {
      setError(`Unsupported format: ${ext}. Use: GLTF, GLB, OBJ, FBX, STL`)
      return
    }
    setError('')
    setFile(f)
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''))
  }

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    handleFile(dropped)
  }, [title])

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const onDragLeave = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) { setError('Select a 3D model file'); return }

    setUploading(true)
    const form = new FormData()
    form.append('model', file)
    form.append('title', title || file.name)
    form.append('description', description)

    try {
      const res = await fetch(`${API}/models`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: form
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setUploading(false); return }
      navigate(`/model/${data.id}`)
    } catch (err) {
      setError('Upload failed. Check your connection.')
      setUploading(false)
    }
  }

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h2 className="page-title" style={{ fontSize: '1.5rem' }}>Upload 3D Model</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          style={{
            border: `2px dashed ${dragOver ? '#4fc3f7' : '#2a2a2a'}`,
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
            background: dragOver ? 'rgba(79,195,247,0.05)' : '#111',
            transition: 'all 0.2s',
            marginBottom: '1rem',
            cursor: 'pointer',
          }}
          onClick={() => document.getElementById('file-input').click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".gltf,.glb,.obj,.fbx,.stl"
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])}
          />
          {file ? (
            <div>
              <p style={{ color: '#4fc3f7', fontWeight: 600, fontSize: '1.1rem' }}>{file.name}</p>
              <p style={{ color: '#666', fontSize: '0.85rem' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '0.5rem' }}>Click or drop to replace</p>
            </div>
          ) : (
            <div>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5" style={{ marginBottom: '0.5rem' }}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p style={{ color: '#888' }}>Drag & drop a 3D model here</p>
              <p style={{ color: '#666', fontSize: '0.8rem' }}>or click to browse</p>
              <p style={{ color: '#555', fontSize: '0.75rem', marginTop: '0.5rem' }}>.gltf .glb .obj .fbx .stl</p>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="My Awesome Model" />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea rows="3" value={description} onChange={e => setDescription(e.target.value)} placeholder="What's this model about?" />
        </div>
        <button
          type="submit"
          className="btn"
          style={{ width: '100%', opacity: uploading ? 0.6 : 1, pointerEvents: uploading ? 'none' : 'auto' }}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
    </div>
  )
}

export default Upload

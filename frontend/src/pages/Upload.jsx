import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function Upload() {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const navigate = useNavigate()
  const { addToast } = useToast()

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
    setProgress(0)
    const form = new FormData()
    form.append('model', file)
    form.append('title', title || file.name)
    form.append('description', description)
    form.append('tags', tags)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API}/models`)
    xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`)

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      setUploading(false)
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText)
        addToast('Upload complete!', 'success')
        navigate(`/model/${data.id}`)
      } else {
        let msg = 'Upload failed'
        try { msg = JSON.parse(xhr.responseText).error || msg } catch {}
        setError(msg)
        addToast(msg, 'error')
      }
    })

    xhr.addEventListener('error', () => {
      setUploading(false)
      setError('Upload failed. Check your connection.')
      addToast('Upload failed. Check your connection.', 'error')
    })

    xhr.send(form)
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

        {/* Progress bar */}
        {uploading && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#888', marginBottom: '0.3rem' }}>
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#2a2a2a', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: '#4fc3f7', borderRadius: '3px', transition: 'width 0.2s ease' }} />
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="My Awesome Model" />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea rows="3" value={description} onChange={e => setDescription(e.target.value)} placeholder="What's this model about?" />
        </div>
        <div className="form-group">
          <label>Tags</label>
          <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="character, wip, reference (comma separated)" />
          <p style={{ color: '#555', fontSize: '0.75rem', marginTop: '0.3rem' }}>Separate tags with commas</p>
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

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function Upload() {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) { setError('Select a 3D model file'); return }

    const form = new FormData()
    form.append('model', file)
    form.append('title', title || file.name)
    form.append('description', description)

    const res = await fetch(`${API}/models`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: form
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }

    navigate(`/model/${data.id}`)
  }

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h2 className="page-title" style={{ fontSize: '1.5rem' }}>Upload 3D Model</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Model File (.gltf, .glb, .obj, .fbx)</label>
          <input type="file" accept=".gltf,.glb,.obj,.fbx" onChange={e => setFile(e.target.files[0])} />
        </div>
        <div className="form-group">
          <label>Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="My Awesome Model" />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea rows="3" value={description} onChange={e => setDescription(e.target.value)} placeholder="What's this model about?" />
        </div>
        <button type="submit" className="btn" style={{ width: '100%' }}>Upload</button>
      </form>
    </div>
  )
}

export default Upload

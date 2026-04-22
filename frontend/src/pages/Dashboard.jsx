import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function Dashboard() {
  const [models, setModels] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', description: '' })
  const token = localStorage.getItem('token')
  const { addToast } = useToast()

  useEffect(() => {
    fetch(`${API}/models/mine`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setModels)
  }, [token])

  const togglePublish = async (id, current) => {
    const res = await fetch(`${API}/models/${id}/publish`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ published: !current })
    })
    if (res.ok) {
      setModels(ms => ms.map(m => m.id === id ? { ...m, published: !current } : m))
      addToast(current ? 'Model unpublished' : 'Model published', 'success')
    } else {
      addToast('Failed to update publish status', 'error')
    }
  }

  const createShare = async (id) => {
    const res = await fetch(`${API}/models/${id}/share`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    const fullUrl = `${window.location.origin}${data.shareUrl}`
    try {
      await navigator.clipboard.writeText(fullUrl)
      addToast('Share link copied to clipboard!', 'success')
    } catch {
      addToast(`Share link: ${fullUrl}`, 'info')
    }
  }

  const deleteModel = async (id, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    const res = await fetch(`${API}/models/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      setModels(ms => ms.filter(m => m.id !== id))
      addToast('Model deleted', 'success')
    } else {
      addToast('Failed to delete model', 'error')
    }
  }

  const startEdit = (model) => {
    setEditingId(model.id)
    setEditForm({ title: model.title, description: model.description || '' })
  }

  const saveEdit = async () => {
    if (!editingId) return
    const res = await fetch(`${API}/models/${editingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(editForm)
    })
    if (res.ok) {
      const updated = await res.json()
      setModels(ms => ms.map(m => m.id === editingId ? updated : m))
      setEditingId(null)
      addToast('Model updated', 'success')
    } else {
      addToast('Failed to update model', 'error')
    }
  }

  const formatDate = (d) => new Date(d).toLocaleDateString()
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  return (
    <div>
      <h1 className="page-title">My Models</h1>
      <Link to="/upload" className="btn" style={{ marginBottom: '1.5rem' }}>Upload New Model</Link>

      {models.length === 0 ? (
        <p style={{ color: '#666' }}>No models yet. Upload your first 3D model!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {models.map(m => (
            <div key={m.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ color: '#4fc3f7' }}>{m.title}</h3>
                  <p style={{ color: '#888', fontSize: '0.9rem' }}>{m.description || 'No description'}</p>
                  <p style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.4rem' }}>
                    {m.originalName} &middot; {formatSize(m.size)} &middot; {formatDate(m.createdAt)}
                  </p>
                </div>
                <span style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: m.published ? '#2e7d32' : '#424242',
                  color: '#fff'
                }}>
                  {m.published ? 'Published' : 'Private'}
                </span>
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Link to={`/model/${m.id}`} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Open</Link>
                <button onClick={() => startEdit(m)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Edit</button>
                <button onClick={() => togglePublish(m.id, m.published)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                  {m.published ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => createShare(m.id)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Share Link</button>
                <button onClick={() => deleteModel(m.id, m.title)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: '#3e2723', borderColor: '#5d4037', color: '#ffab91' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingId && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }} onClick={() => setEditingId(null)}>
          <div style={{ background: '#141419', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '24px', width: '400px', maxWidth: '90vw', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#4fc3f7', marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 600 }}>Edit Model</h3>
            <div className="form-group">
              <label>Title</label>
              <input type="text" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea rows={3} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={saveEdit} className="btn" style={{ flex: 1, padding: '0.5rem' }}>Save</button>
              <button onClick={() => setEditingId(null)} className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
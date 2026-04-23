import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function Dashboard() {
  const [models, setModels] = useState([])
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [myTags, setMyTags] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', tags: '' })
  const token = localStorage.getItem('token')
  const { addToast } = useToast()

  const formatColor = (ext) => {
    const map = { glb: '#4fc3f7', gltf: '#4fc3f7', obj: '#81c784', fbx: '#ffb74d', stl: '#e57373' }
    return map[ext?.toLowerCase()] || '#888'
  }

  useEffect(() => {
    fetch(`${API}/models/mine`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setModels)

    fetch(`${API}/models/tags/mine`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setMyTags)
  }, [token])

  const filtered = models.filter(m => {
    const matchesQuery =
      m.title.toLowerCase().includes(query.toLowerCase()) ||
      (m.description || '').toLowerCase().includes(query.toLowerCase()) ||
      m.originalName.toLowerCase().includes(query.toLowerCase())
    const matchesTag = !activeTag || (m.tags || []).some(t => t.name === activeTag)
    return matchesQuery && matchesTag
  })

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
    setEditForm({
      title: model.title,
      description: model.description || '',
      tags: (model.tags || []).map(t => t.name).join(', ')
    })
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

      {/* Search + Upload row */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <Link to="/upload" className="btn">Upload New Model</Link>
        <input
          type="text"
          placeholder="Search models..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ flex: 1, minWidth: '200px', padding: '0.6rem 0.8rem', background: '#111', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#e0e0e0', fontSize: '1rem' }}
        />
      </div>

      {/* Tag filters */}
      {myTags.length > 0 && (
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
          <span style={{ color: '#666', fontSize: '0.8rem' }}>Filter:</span>
          <button
            onClick={() => setActiveTag('')}
            style={{
              padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', border: '1px solid #2a2a2a',
              background: activeTag === '' ? '#1e3a4c' : '#111', color: activeTag === '' ? '#4fc3f7' : '#888', cursor: 'pointer'
            }}
          >
            All
          </button>
          {myTags.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTag(activeTag === t.name ? '' : t.name)}
              style={{
                padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', border: '1px solid #2a2a2a',
                background: activeTag === t.name ? '#1e3a4c' : '#111', color: activeTag === t.name ? '#4fc3f7' : '#aaa', cursor: 'pointer'
              }}
              title={`${t._count.models} model${t._count.models === 1 ? '' : 's'}`}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p style={{ color: '#666' }}>{query || activeTag ? 'No models match your filters.' : 'No models yet. Upload your first 3D model!'}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {filtered.map(m => (
            <div key={m.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ color: '#4fc3f7', fontSize: '1.05rem', lineHeight: 1.3 }}>{m.title}</h3>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px',
                    background: formatColor(m.originalName?.split('.').pop()), color: '#0a0a0a', flexShrink: 0
                  }}>
                    {m.originalName?.split('.').pop()}
                  </span>
                </div>
                <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.6rem', lineHeight: 1.4 }}>
                  {m.description || 'No description'}
                </p>
                {(m.tags || []).length > 0 && (
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                    {m.tags.map(t => (
                      <span key={t.id} style={{ fontSize: '0.7rem', color: '#4fc3f7', background: '#0f1f2a', padding: '2px 8px', borderRadius: '10px', border: '1px solid #1e3a4c' }}>
                        {t.name}
                      </span>
                    ))}
                  </div>
                )}
                <p style={{ color: '#555', fontSize: '0.7rem' }}>
                  {formatSize(m.size)} &middot; {formatDate(m.createdAt)} &middot; {m.pois?.length || 0} POIs
                </p>
              </div>

              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #1a1a1a', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <Link to={`/model/${m.id}`} className="btn" style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}>Open</Link>
                <button onClick={() => startEdit(m)} className="btn btn-secondary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}>Edit</button>
                <button onClick={() => togglePublish(m.id, m.published)} className="btn btn-secondary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}>
                  {m.published ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => createShare(m.id)} className="btn btn-secondary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}>Share</button>
                <button onClick={() => deleteModel(m.id, m.title)} className="btn btn-secondary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', background: '#3e2723', borderColor: '#5d4037', color: '#ffab91' }}>Delete</button>
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
            <div className="form-group">
              <label>Tags</label>
              <input type="text" value={editForm.tags} onChange={e => setEditForm(f => ({ ...f, tags: e.target.value }))} placeholder="character, wip, reference" />
              <p style={{ color: '#555', fontSize: '0.75rem', marginTop: '0.3rem' }}>Separate tags with commas</p>
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

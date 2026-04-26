import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function formatColor(ext) {
  const map = { glb: '#4fc3f7', gltf: '#4fc3f7', obj: '#81c784', fbx: '#ffb74d', stl: '#e57373' }
  return map[ext?.toLowerCase()] || '#888'
}

function formatDate(d) {
  return new Date(d).toLocaleDateString()
}

function formatSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function CompletionBar({ score = 0 }) {
  const color = score >= 70 ? '#81c784' : score >= 40 ? '#ffb74d' : '#e57373'
  return (
    <div title={`Wiki completeness: ${score}%`} style={{ marginTop: '0.65rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#666', marginBottom: '0.25rem' }}>
        <span>Wiki completeness</span>
        <span>{score}%</span>
      </div>
      <div style={{ height: 5, background: '#1d1d22', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 999 }} />
      </div>
    </div>
  )
}

function Dashboard() {
  const [models, setModels] = useState([])
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('updated')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', tags: '' })
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('token')
  const { addToast } = useToast()

  const refresh = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/models/mine`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed to load library')
      setModels(await res.json())
    } catch (error) {
      addToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [token])

  const allTags = useMemo(() => {
    const map = new Map()
    models.forEach(m => {
      (m.tags || []).forEach(t => {
        map.set(t.name, (map.get(t.name) || 0) + 1)
      })
    })
    return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name, count]) => ({ name, count }))
  }, [models])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    const list = models.filter(m => {
      const matchesQuery = !q || [m.title, m.description, m.originalName, ...(m.tags || []).map(t => t.name), ...(m.summary?.topTerms || []).map(t => t.term)].join(' ').toLowerCase().includes(q)
      const matchesTag = !activeTag || (m.tags || []).some(t => t.name === activeTag)
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'published' ? m.published : !m.published)
      return matchesQuery && matchesTag && matchesStatus
    })
    return list.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      if (sortBy === 'complete') return (b.summary?.completionScore || 0) - (a.summary?.completionScore || 0)
      if (sortBy === 'pois') return (b.summary?.poiCount || 0) - (a.summary?.poiCount || 0)
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
  }, [models, query, activeTag, statusFilter, sortBy])

  const togglePublish = async (id, current) => {
    const res = await fetch(`${API}/models/${id}/publish`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ published: !current })
    })
    if (res.ok) {
      const updated = await res.json()
      setModels(ms => ms.map(m => m.id === id ? updated : m))
      addToast(current ? 'Model unpublished' : 'Model published', 'success')
      refresh()
    } else addToast('Failed to update publish status', 'error')
  }

  const createShare = async (id) => {
    const res = await fetch(`${API}/models/${id}/share`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    if (!res.ok) return addToast(data.error || 'Failed to create share link', 'error')
    const fullUrl = `${window.location.origin}${data.shareUrl}`
    try {
      await navigator.clipboard.writeText(fullUrl)
      addToast('Share link copied to clipboard', 'success')
    } catch {
      addToast(`Share link: ${fullUrl}`, 'info')
    }
  }

  const deleteModel = async (id, title) => {
    if (!confirm(`Delete "${title}" and all of its POIs? This cannot be undone.`)) return
    const res = await fetch(`${API}/models/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) {
      setModels(ms => ms.filter(m => m.id !== id))
      addToast('Model deleted', 'success')
      refresh()
    } else addToast('Failed to delete model', 'error')
  }

  const startEdit = (model) => {
    setEditingId(model.id)
    setEditForm({ title: model.title, description: model.description || '', tags: (model.tags || []).map(t => t.name).join(', ') })
  }

  const saveEdit = async () => {
    if (!editingId) return
    const res = await fetch(`${API}/models/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(editForm)
    })
    if (res.ok) {
      const updated = await res.json()
      setModels(ms => ms.map(m => m.id === editingId ? updated : m))
      setEditingId(null)
      addToast('Model updated', 'success')
      refresh()
    } else addToast('Failed to update model', 'error')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <p style={{ color: '#4fc3f7', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.72rem', fontWeight: 800, marginBottom: '0.35rem' }}>3D Wiki Library</p>
          <h1 className="page-title" style={{ marginBottom: '0.35rem' }}>My Models</h1>
          <p style={{ color: '#888', maxWidth: 680, lineHeight: 1.6 }}>Manage your 3D assets, wiki pages, POIs, and tags.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <Link to="/search" className="btn btn-secondary">Search</Link>
          <Link to="/upload" className="btn">Upload Model</Link>
        </div>
      </div>

      <div className="card" style={{ padding: '0.85rem', marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 160px 160px', gap: '0.6rem' }}>
          <input type="text" placeholder="Filter by title, tag, description, or term..." value={query} onChange={e => setQuery(e.target.value)} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All status</option>
            <option value="published">Published</option>
            <option value="private">Private</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="updated">Newest</option>
            <option value="title">Title</option>
            <option value="complete">Completeness</option>
            <option value="pois">POI count</option>
          </select>
        </div>
        {allTags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.6rem' }}>
            {allTags.slice(0, 12).map(tag => (
              <button
                key={tag.name}
                onClick={() => setActiveTag(activeTag === tag.name ? '' : tag.name)}
                style={{
                  fontSize: '0.7rem',
                  color: activeTag === tag.name ? '#fff' : '#4fc3f7',
                  background: activeTag === tag.name ? '#1e3a4c' : '#0f1f2a',
                  padding: '2px 8px',
                  borderRadius: 10,
                  border: '1px solid #1e3a4c',
                  cursor: 'pointer'
                }}
              >
                {tag.name} ({tag.count})
              </button>
            ))}
          </div>
        )}
        {activeTag && <button onClick={() => setActiveTag('')} style={{ marginTop: '0.6rem', background: '#1e3a4c', color: '#4fc3f7', border: '1px solid #31566b', borderRadius: 999, padding: '0.25rem 0.7rem', cursor: 'pointer' }}>Filtering: {activeTag} &times;</button>}
      </div>

      {loading ? <p style={{ color: '#666' }}>Loading library...</p> : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#888', marginBottom: '1rem' }}>{query || activeTag ? 'No models match your filters.' : 'No models yet. Upload your first 3D model to start a wiki.'}</p>
          <Link to="/upload" className="btn">Upload New Model</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1rem' }}>
          {filtered.map(m => {
            const ext = m.originalName?.split('.').pop()
            return (
              <div key={m.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: '0 0 auto 0', height: 3, background: `linear-gradient(90deg, ${formatColor(ext)}, transparent)` }} />
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.65rem' }}>
                    <div>
                      <h3 style={{ color: '#e0e0e0', fontSize: '1.08rem', lineHeight: 1.25, marginBottom: '0.2rem' }}>{m.title}</h3>
                      <p style={{ color: '#666', fontSize: '0.72rem' }}>{formatSize(m.size)} &middot; {formatDate(m.createdAt)}</p>
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', padding: '3px 7px', borderRadius: 6, background: formatColor(ext), color: '#0a0a0a', height: 'fit-content' }}>{ext}</span>
                  </div>
                  <p style={{ color: '#888', fontSize: '0.86rem', marginBottom: '0.75rem', lineHeight: 1.45, minHeight: 38 }}>{m.description || 'No description yet. Add one to make this easier to search and understand.'}</p>
                  {(m.tags || []).length > 0 && (
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
                      {m.tags.map(t => <button key={t.id} onClick={() => setActiveTag(t.name)} style={{ fontSize: '0.7rem', color: '#4fc3f7', background: '#0f1f2a', padding: '2px 8px', borderRadius: 10, border: '1px solid #1e3a4c', cursor: 'pointer' }}>{t.name}</button>)}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginTop: '0.7rem' }}>
                    <div style={{ background: '#101014', borderRadius: 8, padding: '0.45rem', textAlign: 'center' }}><div style={{ color: '#4fc3f7', fontWeight: 800 }}>{m.summary?.poiCount || 0}</div><div style={{ color: '#666', fontSize: '0.68rem' }}>POIs</div></div>
                    <div style={{ background: '#101014', borderRadius: 8, padding: '0.45rem', textAlign: 'center' }}><div style={{ color: '#81c784', fontWeight: 800 }}>{m.summary?.nestedCount || 0}</div><div style={{ color: '#666', fontSize: '0.68rem' }}>Links</div></div>
                    <div style={{ background: '#101014', borderRadius: 8, padding: '0.45rem', textAlign: 'center' }}><div style={{ color: m.published ? '#81c784' : '#ffab91', fontWeight: 800 }}>{m.published ? 'Live' : 'Private'}</div><div style={{ color: '#666', fontSize: '0.68rem' }}>Status</div></div>
                  </div>
                  <CompletionBar score={m.summary?.completionScore || 0} />
                </div>
                <div style={{ marginTop: '0.9rem', paddingTop: '0.8rem', borderTop: '1px solid #1a1a1a', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <Link to={`/model/${m.id}`} className="btn" style={{ padding: '0.38rem 0.72rem', fontSize: '0.8rem' }}>Open 3D</Link>
                  <Link to={`/model/${m.id}/wiki`} className="btn btn-secondary" style={{ padding: '0.38rem 0.72rem', fontSize: '0.8rem' }}>Wiki</Link>
                  <button onClick={() => startEdit(m)} className="btn btn-secondary" style={{ padding: '0.38rem 0.72rem', fontSize: '0.8rem' }}>Edit</button>
                  <button onClick={() => togglePublish(m.id, m.published)} className="btn btn-secondary" style={{ padding: '0.38rem 0.72rem', fontSize: '0.8rem' }}>{m.published ? 'Unpublish' : 'Publish'}</button>
                  <button onClick={() => createShare(m.id)} className="btn btn-secondary" style={{ padding: '0.38rem 0.72rem', fontSize: '0.8rem' }}>Share</button>
                  <button onClick={() => deleteModel(m.id, m.title)} className="btn btn-secondary" style={{ padding: '0.38rem 0.72rem', fontSize: '0.8rem', background: '#3e2723', borderColor: '#5d4037', color: '#ffab91' }}>Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editingId && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} onClick={() => setEditingId(null)}>
          <div style={{ background: '#141419', border: '1px solid #2a2a2a', borderRadius: 14, padding: 24, width: 460, maxWidth: '92vw', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#4fc3f7', marginBottom: '0.9rem', fontSize: '1.1rem', fontWeight: 700 }}>Edit Model Metadata</h3>
            <div className="form-group"><label>Title</label><input type="text" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="form-group"><label>Description</label><textarea rows={4} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="form-group"><label>Tags</label><input type="text" value={editForm.tags} onChange={e => setEditForm(f => ({ ...f, tags: e.target.value }))} placeholder="anatomy, machine, reference" /><p style={{ color: '#555', fontSize: '0.75rem', marginTop: '0.3rem' }}>Separate tags with commas.</p></div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={saveEdit} className="btn" style={{ flex: 1, padding: '0.55rem' }}>Save</button>
              <button onClick={() => setEditingId(null)} className="btn btn-secondary" style={{ flex: 1, padding: '0.55rem' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard

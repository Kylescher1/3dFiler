import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../contexts/ToastContext'
import { Plus, Search, Filter, Box, MapPin, Link2, Eye, EyeOff, Edit2, Trash2, Share2, ExternalLink, X } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function formatColor(ext) {
  const map = { glb: '#00e5ff', gltf: '#00e5ff', obj: '#22c55e', fbx: '#f59e0b', stl: '#ef4444' }
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
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <div title={`Wiki completeness: ${score}%`} style={{ marginTop: '0.65rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        <span>Wiki completeness</span>
        <span>{score}%</span>
      </div>
      <div style={{ height: 3, background: 'rgba(0,0,0,0.4)', borderRadius: 999, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 999 }}
        />
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
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--neon-cyan)', textTransform: 'uppercase', letterSpacing: '2px' }}>// Personal Library</span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 700, marginTop: '0.35rem', marginBottom: '0.3rem' }}>
              My Models
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage your 3D assets, wiki pages, POIs, and tags.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <Link to="/search" className="btn-ghost">
              <Search size={14} />
              Search
            </Link>
            <Link to="/upload" className="btn-primary">
              <Plus size={14} />
              Upload Model
            </Link>
          </div>
        </div>

        <div className="card-modern" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 160px 160px', gap: '0.6rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" placeholder="Filter by title, tag, description, or term..." value={query} onChange={e => setQuery(e.target.value)} style={{ paddingLeft: '2.5rem', background: 'var(--bg-tertiary)' }} />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ background: 'var(--bg-tertiary)' }}>
              <option value="all">All status</option>
              <option value="published">Published</option>
              <option value="private">Private</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: 'var(--bg-tertiary)' }}>
              <option value="updated">Newest</option>
              <option value="title">Title</option>
              <option value="complete">Completeness</option>
              <option value="pois">POI count</option>
            </select>
          </div>
          {allTags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.75rem' }}>
              {allTags.slice(0, 12).map(tag => (
                <button
                  key={tag.name}
                  onClick={() => setActiveTag(activeTag === tag.name ? '' : tag.name)}
                  className="tag-minimal"
                  style={{
                    color: activeTag === tag.name ? '#fff' : 'var(--neon-cyan)',
                    background: activeTag === tag.name ? 'rgba(0, 229, 255, 0.2)' : 'rgba(0, 229, 255, 0.05)',
                    cursor: 'pointer'
                  }}
                >
                  {tag.name} ({tag.count})
                </button>
              ))}
            </div>
          )}
          {activeTag && (
            <button onClick={() => setActiveTag('')} className="tag-minimal" style={{ marginTop: '0.6rem', cursor: 'pointer', borderColor: 'var(--neon-red)', color: 'var(--neon-red)' }}>
              Filtering: {activeTag} <X size={10} />
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              LOADING ASSETS...
            </motion.div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-modern" style={{ textAlign: 'center', padding: '3rem' }}>
            <Box size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {query || activeTag ? 'No models match your filters.' : 'No models yet. Upload your first 3D model to start a wiki.'}
            </p>
            <Link to="/upload" className="btn-primary">
              <Plus size={14} />
              Upload New Model
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            <AnimatePresence>
              {filtered.map((m, i) => {
                const ext = m.originalName?.split('.').pop()
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.03, duration: 0.4 }}
                    className="card-modern holo-border"
                    style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', padding: '1.25rem' }}
                  >
                    <div style={{ position: 'absolute', inset: '0 0 auto 0', height: 2, background: `linear-gradient(90deg, ${formatColor(ext)}, transparent)` }} />
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.65rem' }}>
                        <div style={{ overflow: 'hidden' }}>
                          <h3 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', lineHeight: 1.25, marginBottom: '0.2rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</h3>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>{formatSize(m.size)} &middot; {formatDate(m.createdAt)}</p>
                        </div>
                        <span className="tag-minimal" style={{ color: formatColor(ext), borderColor: formatColor(ext), background: `${formatColor(ext)}10`, height: 'fit-content', flexShrink: 0 }}>{ext}</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem', lineHeight: 1.45, minHeight: 38 }}>
                        {m.description || 'No description yet. Add one to make this easier to search and understand.'}
                      </p>
                      {(m.tags || []).length > 0 && (
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
                          {m.tags.map(t => <button key={t.id} onClick={() => setActiveTag(t.name)} className="tag-minimal" style={{ cursor: 'pointer' }}>{t.name}</button>)}
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginTop: '0.7rem' }}>
                        <div className="stat-box" style={{ padding: '0.5rem' }}>
                          <div className="value" style={{ fontSize: '1rem' }}>{m.summary?.poiCount || 0}</div>
                          <div className="label" style={{ fontSize: '0.6rem' }}>POIs</div>
                        </div>
                        <div className="stat-box" style={{ padding: '0.5rem' }}>
                          <div className="value" style={{ fontSize: '1rem', color: 'var(--neon-purple)' }}>{m.summary?.nestedCount || 0}</div>
                          <div className="label" style={{ fontSize: '0.6rem' }}>Links</div>
                        </div>
                        <div className="stat-box" style={{ padding: '0.5rem' }}>
                          <div className="value" style={{ fontSize: '1rem', color: m.published ? '#22c55e' : '#f59e0b' }}>{m.published ? 'LIVE' : 'PVT'}</div>
                          <div className="label" style={{ fontSize: '0.6rem' }}>Status</div>
                        </div>
                      </div>
                      <CompletionBar score={m.summary?.completionScore || 0} />
                    </div>
                    <div style={{ marginTop: '0.9rem', paddingTop: '0.8rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                      <Link to={`/model/${m.id}`} className="btn-primary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}>
                        <ExternalLink size={12} />
                        3D
                      </Link>
                      <Link to={`/model/${m.id}/wiki`} className="btn-ghost" style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}>
                        <FileText size={12} />
                        Wiki
                      </Link>
                      <button onClick={() => startEdit(m)} className="btn-ghost" style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}>
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => togglePublish(m.id, m.published)} className="btn-ghost" style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}>
                        {m.published ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                      <button onClick={() => createShare(m.id)} className="btn-ghost" style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}>
                        <Share2 size={12} />
                      </button>
                      <button onClick={() => deleteModel(m.id, m.title)} className="btn-danger" style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

        {editingId && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setEditingId(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: 24, width: 460, maxWidth: '92vw', boxShadow: 'var(--shadow-card)', position: 'relative' }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ color: 'var(--neon-cyan)', marginBottom: '0.9rem', fontSize: '1.1rem', fontWeight: 600, fontFamily: 'var(--font-display)' }}>Edit Model Metadata</h3>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.4rem' }}>Title</label>
                <input type="text" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.4rem' }}>Description</label>
                <textarea rows={4} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.4rem' }}>Tags</label>
                <input type="text" value={editForm.tags} onChange={e => setEditForm(f => ({ ...f, tags: e.target.value }))} placeholder="aerospace, engine, reference" />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.3rem' }}>Separate tags with commas.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={saveEdit} className="btn-primary" style={{ flex: 1, padding: '0.6rem' }}>
                  Save
                </button>
                <button onClick={() => setEditingId(null)} className="btn-ghost" style={{ flex: 1, padding: '0.6rem' }}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default Dashboard

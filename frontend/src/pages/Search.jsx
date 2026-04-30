import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search as SearchIcon, Box, ArrowRight, FileText, Tag } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function formatColor(ext) {
  const map = { glb: '#00e5ff', gltf: '#00e5ff', obj: '#22c55e', fbx: '#f59e0b', stl: '#ef4444' }
  return map[ext?.toLowerCase()] || '#888'
}

function Highlight({ text = '', query = '' }) {
  if (!query || !text) return text || null
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx < 0) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '0 2px', borderRadius: 3 }}>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ models: [], pois: [], terms: [] })
  const [exploreModels, setExploreModels] = useState([])
  const [loading, setLoading] = useState(false)
  const [exploreLoading, setExploreLoading] = useState(true)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')
  const token = localStorage.getItem('token')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inputRef = useRef(null)

  useEffect(() => {
    fetch(`${API}/models/explore`)
      .then(r => r.json())
      .then(data => {
        setExploreModels(data)
        setExploreLoading(false)
      })
      .catch(() => setExploreLoading(false))
  }, [])

  useEffect(() => {
    const q = searchParams.get('q') || ''
    setQuery(q)
    if (q.trim()) performSearch(q)
    else {
      setResults({ models: [], pois: [], terms: [] })
      setSearched(false)
      setError('')
    }
  }, [searchParams])

  useEffect(() => { inputRef.current?.focus() }, [])

  const performSearch = async (q) => {
    if (!token) {
      setError('Authentication required for library search.')
      setSearched(true)
      return
    }
    setLoading(true)
    setSearched(true)
    setError('')
    try {
      const res = await fetch(`${API}/models/search?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Search failed')
      setResults({ models: data.models || [], pois: data.pois || [], terms: data.terms || [] })
    } catch (err) {
      setResults({ models: [], pois: [], terms: [] })
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const total = (results.models?.length || 0) + (results.pois?.length || 0)

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--neon-cyan)', textTransform: 'uppercase', letterSpacing: '2px' }}>// Discovery</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 700, marginTop: '0.35rem', marginBottom: '0.3rem' }}>
            Explore Models
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Browse public models or search your personal 3D wiki.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
          <div className="card-modern" style={{ padding: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <SearchIcon size={18} color="var(--text-muted)" />
            <input ref={inputRef} type="text" placeholder="Search models, wiki pages, tags, POIs..." value={query} onChange={e => setQuery(e.target.value)} style={{ background: 'transparent', border: 'none', padding: 0, fontSize: '1rem', flex: 1 }} />
            <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
              <SearchIcon size={14} />
              Search
            </button>
          </div>
        </form>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--neon-red)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </motion.div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              SCANNING DATABASE...
            </motion.div>
          </div>
        )}

        {!loading && !searched && (
          <>
            {exploreLoading ? (
              <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Loading published models...</p>
            ) : exploreModels.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No published models yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {exploreModels.map((m, i) => {
                  const ext = m.originalName?.split('.').pop()
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05, duration: 0.4 }}
                    >
                      <Link to={`/model/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="card-modern holo-border" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', inset: '0 0 auto 0', height: 2, background: `linear-gradient(90deg, ${formatColor(ext)}, transparent)` }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.6rem' }}>
                            <h3 style={{ color: 'var(--neon-cyan)', fontSize: '1rem', lineHeight: 1.3, fontWeight: 600 }}>{m.title}</h3>
                            <span className="tag-minimal" style={{ color: formatColor(ext), borderColor: formatColor(ext), background: `${formatColor(ext)}10`, flexShrink: 0 }}>{ext}</span>
                          </div>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.45, marginBottom: '0.6rem' }}>{m.description || 'No description'}</p>
                          {(m.tags || []).length > 0 && (
                            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                              {m.tags.slice(0, 4).map(t => (
                                <span key={t.id} className="tag-minimal" style={{ fontSize: '0.6rem' }}>{t.name}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {!loading && searched && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                {total} RESULT{total === 1 ? '' : 'S'} FOR <span style={{ color: 'var(--text-primary)' }}>&ldquo;{searchParams.get('q')}&rdquo;</span>
              </p>
              {(results.terms || []).length > 0 && (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {results.terms.slice(0, 8).map(term => (
                    <button key={term.term} onClick={() => navigate(`/search?q=${encodeURIComponent(term.term)}`)} className="tag-minimal" style={{ cursor: 'pointer' }}>
                      {term.term}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <section>
              <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Box size={14} />
                Models <span style={{ color: 'var(--border-medium)' }}>({results.models.length})</span>
              </h2>
              {results.models.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No models found.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
                  {results.models.map((m, i) => {
                    const ext = m.originalName?.split('.').pop()
                    return (
                      <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Link to={`/model/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div className="card-modern" style={{ padding: '1rem', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', inset: '0 0 auto 0', height: 2, background: `linear-gradient(90deg, ${formatColor(ext)}, transparent)` }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.4rem' }}>
                              <h3 style={{ color: 'var(--neon-cyan)', fontSize: '0.95rem', fontWeight: 600 }}><Highlight text={m.title} query={query} /></h3>
                              <span className="tag-minimal" style={{ color: formatColor(ext), borderColor: formatColor(ext), background: `${formatColor(ext)}10`, flexShrink: 0 }}>{ext}</span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4 }}><Highlight text={m.excerpt || m.description || 'No description'} query={query} /></p>
                          </div>
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </section>

            <section>
              <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={14} />
                Points of Interest <span style={{ color: 'var(--border-medium)' }}>({results.pois.length})</span>
              </h2>
              {results.pois.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No POIs found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {results.pois.map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                      <Link to={`/model/${p.model.id}?poi=${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="card-modern" style={{ padding: '0.8rem 1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                            <div>
                              <h3 style={{ color: 'var(--neon-cyan)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.2rem' }}><Highlight text={p.title} query={query} /></h3>
                              <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.4 }}><Highlight text={p.excerpt || p.content || 'No content'} query={query} /></p>
                            </div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>in {p.model.title}</span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default Search

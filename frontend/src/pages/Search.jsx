import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function formatColor(ext) {
  const map = { glb: '#4fc3f7', gltf: '#4fc3f7', obj: '#81c784', fbx: '#ffb74d', stl: '#e57373' }
  return map[ext?.toLowerCase()] || '#888'
}

function Highlight({ text = '', query = '' }) {
  if (!query || !text) return text || null
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx < 0) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(255,183,77,0.22)', color: '#ffcc80', padding: '0 2px', borderRadius: 3 }}>{text.slice(idx, idx + query.length)}</mark>
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
      setError('Please log in to search your library.')
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
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <p style={{ color: '#4fc3f7', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.72rem', fontWeight: 800, marginBottom: '0.35rem' }}>Discover & Search</p>
        <h1 className="page-title" style={{ marginBottom: '0.3rem' }}>Explore Models</h1>
        <p style={{ color: '#888' }}>Browse published models or search your personal 3D wiki.</p>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: '0.8rem', marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.6rem' }}>
          <input ref={inputRef} type="text" placeholder="Search models, wiki pages, tags, POIs..." value={query} onChange={e => setQuery(e.target.value)} style={{ fontSize: '1rem' }} />
          <button type="submit" className="btn" style={{ paddingInline: '1.2rem' }}>Search</button>
        </div>
      </form>

      {error && <div className="error">{error}</div>}
      {loading && <p style={{ color: '#666' }}>Searching your 3D wiki...</p>}

      {!loading && !searched && (
        <>
          {exploreLoading ? (
            <p style={{ color: '#666' }}>Loading published models...</p>
          ) : exploreModels.length === 0 ? (
            <p style={{ color: '#666' }}>No published models yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {exploreModels.map(m => {
                const ext = m.originalName?.split('.').pop()
                return (
                  <Link key={m.id} to={`/model/${m.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: '0 0 auto 0', height: 3, background: `linear-gradient(90deg, ${formatColor(ext)}, transparent)` }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ color: '#4fc3f7', fontSize: '1rem', lineHeight: 1.3 }}>{m.title}</h3>
                      <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', padding: '2px 6px', borderRadius: 5, background: formatColor(ext), color: '#0a0a0a' }}>{ext}</span>
                    </div>
                    <p style={{ color: '#888', fontSize: '0.82rem', lineHeight: 1.45, marginBottom: '0.6rem' }}>{m.description || 'No description'}</p>
                    {(m.tags || []).length > 0 && (
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                        {m.tags.map(t => (
                          <span key={t.id} style={{ fontSize: '0.68rem', color: '#4fc3f7', background: '#0f1f2a', padding: '2px 7px', borderRadius: 10, border: '1px solid #1e3a4c' }}>
                            {t.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </>
      )}

      {!loading && searched && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <p style={{ color: '#888' }}>{total} result{total === 1 ? '' : 's'} for <span style={{ color: '#e0e0e0' }}>&ldquo;{searchParams.get('q')}&rdquo;</span></p>
            {(results.terms || []).length > 0 && (
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {results.terms.slice(0, 8).map(term => <button key={term.term} onClick={() => navigate(`/search?q=${encodeURIComponent(term.term)}`)} style={{ color: '#4fc3f7', background: '#0f1f2a', border: '1px solid #1e3a4c', borderRadius: 999, padding: '0.22rem 0.6rem', fontSize: '0.74rem', cursor: 'pointer' }}>{term.term}</button>)}
              </div>
            )}
          </div>

          <section>
            <h2 style={{ color: '#ccc', fontSize: '1rem', marginBottom: '0.75rem' }}>Models <span style={{ color: '#666' }}>({results.models.length})</span></h2>
            {results.models.length === 0 ? <p style={{ color: '#555' }}>No models found.</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
                {results.models.map(m => {
                  const ext = m.originalName?.split('.').pop()
                  return (
                    <Link key={m.id} to={`/model/${m.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', inset: '0 0 auto 0', height: 3, background: `linear-gradient(90deg, ${formatColor(ext)}, transparent)` }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ color: '#4fc3f7', fontSize: '1rem', lineHeight: 1.3 }}><Highlight text={m.title} query={query} /></h3>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', padding: '2px 6px', borderRadius: 5, background: formatColor(ext), color: '#0a0a0a' }}>{ext}</span>
                      </div>
                      <p style={{ color: '#888', fontSize: '0.82rem', lineHeight: 1.45, marginBottom: '0.6rem' }}><Highlight text={m.excerpt || m.description || 'No description'} query={query} /></p>
                      {(m.tags || []).length > 0 && <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>{m.tags.map(t => <span key={t.id} style={{ fontSize: '0.68rem', color: '#4fc3f7', background: '#0f1f2a', padding: '2px 7px', borderRadius: 10, border: '1px solid #1e3a4c' }}>{t.name}</span>)}</div>}
                    </Link>
                  )
                })}
              </div>
            )}
          </section>

          <section>
            <h2 style={{ color: '#ccc', fontSize: '1rem', marginBottom: '0.75rem' }}>Points of Interest <span style={{ color: '#666' }}>({results.pois.length})</span></h2>
            {results.pois.length === 0 ? <p style={{ color: '#555' }}>No POIs found.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {results.pois.map(p => (
                  <Link key={p.id} to={`/model/${p.model.id}?poi=${p.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit', padding: '0.8rem 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                      <div>
                        <h3 style={{ color: '#4fc3f7', fontSize: '0.98rem', marginBottom: '0.25rem' }}><Highlight text={p.title} query={query} /></h3>
                        <p style={{ color: '#888', fontSize: '0.82rem', lineHeight: 1.45 }}><Highlight text={p.excerpt || p.content || 'No content'} query={query} /></p>
                      </div>
                      <span style={{ color: '#555', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>in {p.model.title}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

export default Search

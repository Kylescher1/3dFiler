import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ models: [], pois: [] })
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const token = localStorage.getItem('token')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inputRef = useRef(null)

  useEffect(() => {
    const q = searchParams.get('q') || ''
    setQuery(q)
    if (q.trim()) {
      performSearch(q)
    } else {
      setResults({ models: [], pois: [] })
      setSearched(false)
    }
  }, [searchParams])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const performSearch = async (q) => {
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`${API}/models/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setResults(data)
    } catch {
      setResults({ models: [], pois: [] })
    }
    setLoading(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const formatColor = (ext) => {
    const map = { glb: '#4fc3f7', gltf: '#4fc3f7', obj: '#81c784', fbx: '#ffb74d', stl: '#e57373' }
    return map[ext?.toLowerCase()] || '#888'
  }

  return (
    <div>
      <h1 className="page-title">Search</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search models, descriptions, tags, and POIs..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ width: '100%', maxWidth: '500px', padding: '0.7rem 1rem', background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#e0e0e0', fontSize: '1rem' }}
        />
      </form>

      {loading && <p style={{ color: '#666' }}>Searching...</p>}

      {!loading && searched && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Models */}
          <div>
            <h2 style={{ color: '#ccc', fontSize: '1rem', marginBottom: '0.75rem' }}>
              Models <span style={{ color: '#666' }}>({results.models.length})</span>
            </h2>
            {results.models.length === 0 ? (
              <p style={{ color: '#555' }}>No models found.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
                {results.models.map(m => (
                  <Link key={m.id} to={`/model/${m.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <h3 style={{ color: '#4fc3f7', fontSize: '0.95rem' }}>{m.title}</h3>
                      <span style={{
                        fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', padding: '2px 5px', borderRadius: '4px',
                        background: formatColor(m.originalName?.split('.').pop()), color: '#0a0a0a', flexShrink: 0
                      }}>
                        {m.originalName?.split('.').pop()}
                      </span>
                    </div>
                    <p style={{ color: '#888', fontSize: '0.8rem' }}>{m.description || 'No description'}</p>
                    {(m.tags || []).length > 0 && (
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                        {m.tags.map(t => (
                          <span key={t.id} style={{ fontSize: '0.7rem', color: '#4fc3f7', background: '#0f1f2a', padding: '2px 8px', borderRadius: '10px', border: '1px solid #1e3a4c' }}>
                            {t.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* POIs */}
          <div>
            <h2 style={{ color: '#ccc', fontSize: '1rem', marginBottom: '0.75rem' }}>
              Points of Interest <span style={{ color: '#666' }}>({results.pois.length})</span>
            </h2>
            {results.pois.length === 0 ? (
              <p style={{ color: '#555' }}>No POIs found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {results.pois.map(p => (
                  <Link key={p.id} to={`/model/${p.model.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit', padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ color: '#4fc3f7', fontSize: '0.95rem', marginBottom: '0.25rem' }}>{p.title}</h3>
                        <p style={{ color: '#888', fontSize: '0.8rem', lineHeight: 1.4 }}>
                          {p.content?.length > 120 ? p.content.slice(0, 120) + '...' : (p.content || 'No content')}
                        </p>
                      </div>
                      <span style={{ color: '#555', fontSize: '0.7rem', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                        in {p.model.title}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Search

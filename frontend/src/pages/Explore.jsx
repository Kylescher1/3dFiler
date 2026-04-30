import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function Explore() {
  const [models, setModels] = useState([])
  const [query, setQuery] = useState('')

  const formatColor = (ext) => {
    const map = { glb: '#b91c1c', gltf: '#b91c1c', obj: '#81c784', fbx: '#ffb74d', stl: '#dc2626' }
    return map[ext?.toLowerCase()] || '#888'
  }

  useEffect(() => {
    fetch(`${API}/models/explore`)
      .then(r => r.json())
      .then(setModels)
  }, [])

  const filtered = models.filter(m =>
    m.title.toLowerCase().includes(query.toLowerCase()) ||
    (m.description || '').toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div>
      <h1 className="page-title">Explore Models</h1>
      <input
        type="text"
        placeholder="Search published models..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{ width: '100%', maxWidth: '400px', marginBottom: '1.5rem', padding: '0.6rem 0.8rem', background: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '6px', color: '#333333', fontSize: '1rem' }}
      />
      {filtered.length === 0 ? (
        <p style={{ color: '#888888' }}>{query ? 'No models match your search.' : 'No published models yet.'}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {filtered.map(m => (
            <Link key={m.id} to={`/model/${m.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ color: '#b91c1c' }}>{m.title}</h3>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', background: formatColor(m.originalName?.split('.').pop()), color: '#ffffff', flexShrink: 0 }}>
                  {m.originalName?.split('.').pop()}
                </span>
              </div>
              <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{m.description || 'No description'}</p>
              {(m.tags || []).length > 0 && (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {m.tags.map(t => (
                    <span key={t.id} style={{ fontSize: '0.7rem', color: '#b91c1c', background: '#fef2f2', padding: '2px 8px', borderRadius: '10px', border: '1px solid #fee2e2' }}>
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
  )
}

export default Explore

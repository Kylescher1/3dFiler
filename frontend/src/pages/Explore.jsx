import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function Explore() {
  const [models, setModels] = useState([])
  const [query, setQuery] = useState('')

  const formatColor = (ext) => {
    const map = { glb: '#4fc3f7', gltf: '#4fc3f7', obj: '#81c784', fbx: '#ffb74d', stl: '#e57373' }
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
        style={{ width: '100%', maxWidth: '400px', marginBottom: '1.5rem', padding: '0.6rem 0.8rem', background: '#111', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#e0e0e0', fontSize: '1rem' }}
      />
      {filtered.length === 0 ? (
        <p style={{ color: '#666' }}>{query ? 'No models match your search.' : 'No published models yet.'}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {filtered.map(m => (
            <Link key={m.id} to={`/model/${m.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ color: '#4fc3f7' }}>{m.title}</h3>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', background: formatColor(m.originalName?.split('.').pop()), color: '#0a0a0a', flexShrink: 0 }}>
                  {m.originalName?.split('.').pop()}
                </span>
              </div>
              <p style={{ color: '#888', fontSize: '0.9rem' }}>{m.description || 'No description'}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default Explore

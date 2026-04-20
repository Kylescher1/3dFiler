import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function Explore() {
  const [models, setModels] = useState([])

  useEffect(() => {
    fetch(`${API}/models/explore`)
      .then(r => r.json())
      .then(setModels)
  }, [])

  return (
    <div>
      <h1 className="page-title">Explore Models</h1>
      {models.length === 0 ? (
        <p style={{ color: '#666' }}>No published models yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {models.map(m => (
            <Link key={m.id} to={`/model/${m.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <h3 style={{ color: '#4fc3f7', marginBottom: '0.5rem' }}>{m.title}</h3>
              <p style={{ color: '#888', fontSize: '0.9rem' }}>{m.description || 'No description'}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default Explore

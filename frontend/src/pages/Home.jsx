import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function Home() {
  const [recent, setRecent] = useState([])

  useEffect(() => {
    setRecent(JSON.parse(localStorage.getItem('recentModels') || '[]'))
  }, [])

  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#4fc3f7' }}>
        3dFiler
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#aaa', maxWidth: '600px', margin: '0 auto 2rem' }}>
        Upload 3D models, create interactive points of interest, and share your creations with the world.
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '3rem' }}>
        <Link to="/explore" className="btn">Explore Models</Link>
        <Link to="/upload" className="btn btn-secondary">Upload Model</Link>
      </div>

      {recent.length > 0 && (
        <div style={{ textAlign: 'left', maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.1rem', color: '#ccc', marginBottom: '0.75rem' }}>Recently Viewed</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recent.map(m => (
              <Link key={m.id} to={`/model/${m.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#4fc3f7', fontWeight: 600 }}>{m.title}</span>
                <span style={{ color: '#666', fontSize: '0.75rem', textTransform: 'uppercase' }}>{m.extension}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Home

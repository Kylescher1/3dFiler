import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function Dashboard() {
  const [models, setModels] = useState([])
  const token = localStorage.getItem('token')

  useEffect(() => {
    fetch(`${API}/models/mine`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setModels)
  }, [token])

  const togglePublish = async (id, current) => {
    await fetch(`${API}/models/${id}/publish`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ published: !current })
    })
    setModels(ms => ms.map(m => m.id === id ? { ...m, published: !current } : m))
  }

  const createShare = async (id) => {
    const res = await fetch(`${API}/models/${id}/share`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    alert(`Share link: ${window.location.origin}${data.shareUrl}`)
  }

  return (
    <div>
      <h1 className="page-title">My Models</h1>
      <Link to="/upload" className="btn" style={{ marginBottom: '1.5rem' }}>Upload New Model</Link>

      {models.length === 0 ? (
        <p style={{ color: '#666' }}>No models yet. Upload your first 3D model!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {models.map(m => (
            <div key={m.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ color: '#4fc3f7' }}>{m.title}</h3>
                  <p style={{ color: '#888', fontSize: '0.9rem' }}>{m.description || 'No description'}</p>
                </div>
                <span style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: m.published ? '#2e7d32' : '#424242',
                  color: '#fff'
                }}>
                  {m.published ? 'Published' : 'Private'}
                </span>
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <Link to={`/model/${m.id}`} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Open</Link>
                <button onClick={() => togglePublish(m.id, m.published)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                  {m.published ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => createShare(m.id)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Share Link</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard
import { Link } from 'react-router-dom'

function Home() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#4fc3f7' }}>
        3dFiler
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#aaa', maxWidth: '600px', margin: '0 auto 2rem' }}>
        Upload 3D models, create interactive points of interest, and share your creations with the world.
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link to="/explore" className="btn">Explore Models</Link>
        <Link to="/upload" className="btn btn-secondary">Upload Model</Link>
      </div>
    </div>
  )
}

export default Home

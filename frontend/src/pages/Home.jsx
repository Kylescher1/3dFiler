import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Home.css'

const highlights = [
  { title: 'Realtime 3D Showcase', description: 'Present photoreal assets with smooth, browser-native model interaction.' },
  { title: 'POI Story Layers', description: 'Attach technical notes, callouts, and annotations directly into the scene.' },
  { title: 'Hackathon Ready', description: 'Fast upload-to-demo pipeline for judges, teammates, and stakeholders.' },
]

function Home() {
  const [recent, setRecent] = useState([])

  useEffect(() => {
    setRecent(JSON.parse(localStorage.getItem('recentModels') || '[]'))
  }, [])

  return (
    <div className="home-page">
      <section className="hero-panel">
        <div className="hero-grid" />
        <div className="hero-content">
          <p className="eyebrow">AEROSPACE-GRADE 3D INTELLIGENCE</p>
          <h1>3dFiler Mission Control</h1>
          <p className="hero-sub">
            A sleek, matrix-inspired platform for uploading, analyzing, and presenting advanced 3D assets with cinematic precision.
          </p>
          <div className="hero-actions">
            <Link to="/search" className="btn btn-primary-glow">Launch Explorer</Link>
            <Link to="/upload" className="btn btn-ghost">Deploy Model</Link>
          </div>
        </div>
        <div className="hero-orb" aria-hidden="true" />
      </section>

      <section className="highlights">
        {highlights.map((item) => (
          <article className="highlight-card" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </section>

      {recent.length > 0 && (
        <section className="recent-section">
          <div className="section-header">
            <h2>Recent Flight Deck</h2>
            <span>{recent.length} viewed assets</span>
          </div>
          <div className="recent-list">
            {recent.map((m) => (
              <Link key={m.id} to={`/model/${m.id}`} className="recent-card">
                <span className="recent-title">{m.title}</span>
                <span className="recent-ext">{m.extension}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default Home

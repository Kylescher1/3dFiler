import { Hexagon } from 'lucide-react'

export default function LandingScene() {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
      background: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Subtle dot grid background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(185,28,28,0.08) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        opacity: 0.5
      }} />

      {/* Large faded geometric rings */}
      <div style={{
        position: 'absolute',
        width: 'clamp(300px, 50vw, 700px)',
        height: 'clamp(300px, 50vw, 700px)',
        borderRadius: '50%',
        border: '1px solid rgba(185,28,28,0.08)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: 'clamp(420px, 70vw, 950px)',
        height: 'clamp(420px, 70vw, 950px)',
        borderRadius: '50%',
        border: '1px solid rgba(185,28,28,0.05)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: 'clamp(540px, 90vw, 1200px)',
        height: 'clamp(540px, 90vw, 1200px)',
        borderRadius: '50%',
        border: '1px solid rgba(185,28,28,0.03)',
        pointerEvents: 'none'
      }} />

      {/* Corner accent lines */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.15 }}>
        <line x1="5%" y1="0" x2="5%" y2="12%" stroke="#b91c1c" strokeWidth="1" />
        <line x1="0" y1="5%" x2="8%" y2="5%" stroke="#b91c1c" strokeWidth="1" />
        <line x1="95%" y1="0" x2="95%" y2="12%" stroke="#b91c1c" strokeWidth="1" />
        <line x1="100%" y1="5%" x2="92%" y2="5%" stroke="#b91c1c" strokeWidth="1" />
        <line x1="5%" y1="100%" x2="5%" y2="88%" stroke="#b91c1c" strokeWidth="1" />
        <line x1="0" y1="95%" x2="8%" y2="95%" stroke="#b91c1c" strokeWidth="1" />
        <line x1="95%" y1="100%" x2="95%" y2="88%" stroke="#b91c1c" strokeWidth="1" />
        <line x1="100%" y1="95%" x2="92%" y2="95%" stroke="#b91c1c" strokeWidth="1" />
      </svg>

      {/* Central brand composition */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem'
      }}>
        {/* Main hexagon mark */}
        <div style={{
          width: 'clamp(120px, 18vw, 220px)',
          height: 'clamp(120px, 18vw, 220px)',
          borderRadius: '50%',
          border: '2px solid rgba(185,28,28,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          {/* Inner ring */}
          <div style={{
            position: 'absolute',
            width: '80%',
            height: '80%',
            borderRadius: '50%',
            border: '1px solid rgba(185,28,28,0.1)'
          }} />
          <Hexagon size={72} color="#b91c1c" strokeWidth={1.2} style={{ opacity: 0.9 }} />
        </div>

        {/* Brand text */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            fontWeight: 800,
            letterSpacing: '6px',
            color: '#111111',
            textTransform: 'uppercase',
            marginBottom: '0.5rem'
          }}>
            3D Filer
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(0.65rem, 1.2vw, 0.85rem)',
            color: '#888888',
            letterSpacing: '3px',
            textTransform: 'uppercase'
          }}>
            Wiki Knowledge Base Platform
          </div>
        </div>
      </div>

      {/* Bottom gradient fade into page content */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 180,
        background: 'linear-gradient(to top, #ffffff, transparent)',
        pointerEvents: 'none',
        zIndex: 3
      }} />
    </div>
  )
}

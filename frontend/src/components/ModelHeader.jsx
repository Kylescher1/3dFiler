import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Hexagon } from 'lucide-react'

export default function ModelHeader({ model, breadcrumbs = [], leftLink = '/dashboard', mode = 'viewer', onOpenViewer, onOpenWiki, extraButtons }) {
  const panelStyle = {
    background: 'rgba(5, 5, 8, 0.92)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '10px',
    backdropFilter: 'blur(20px)',
  }

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', zIndex: 20, pointerEvents: 'none' }}>
      <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '12px', ...panelStyle, padding: '8px 14px' }}>
        <Link to={leftLink} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--neon-cyan)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', fontFamily: 'var(--font-display)', letterSpacing: '1px' }}>
          <Hexagon size={20} strokeWidth={2.5} />
          3DFILER
        </Link>
        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.08)' }} />
        <div>
          {breadcrumbs.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px', flexWrap: 'wrap', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              {breadcrumbs.map((crumb, idx) => (
                <span key={crumb.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {idx > 0 && <span style={{ color: 'rgba(255,255,255,0.15)' }}>/</span>}
                  <span style={{ color: idx === breadcrumbs.length - 1 ? 'var(--text-primary)' : 'var(--neon-cyan)' }}>
                    {crumb.title}
                  </span>
                </span>
              ))}
            </div>
          )}
          <h1 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', margin: 0, fontWeight: 600, lineHeight: 1.2 }}>{model?.title || 'Model'}</h1>
          {model?.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: '2px 0 0', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{model.description}</p>}
        </div>
      </div>
      <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '8px', ...panelStyle, padding: '4px' }}>
        {extraButtons}
        <div style={{ display: 'flex', gap: '2px', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '3px' }}>
          <button onClick={onOpenViewer} style={{ width: '88px', height: '30px', borderRadius: '6px', border: 'none', background: mode === 'viewer' ? 'rgba(0, 229, 255, 0.15)' : 'transparent', color: mode === 'viewer' ? 'var(--neon-cyan)' : 'var(--text-muted)', cursor: mode === 'viewer' ? 'default' : 'pointer', fontSize: '0.78rem', fontWeight: mode === 'viewer' ? 600 : 500, fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>
            VIEWER
          </button>
          <button onClick={onOpenWiki} style={{ width: '88px', height: '30px', borderRadius: '6px', border: 'none', background: mode === 'wiki' ? 'rgba(0, 229, 255, 0.15)' : 'transparent', color: mode === 'wiki' ? 'var(--neon-cyan)' : 'var(--text-muted)', cursor: mode === 'wiki' ? 'default' : 'pointer', fontSize: '0.78rem', fontWeight: mode === 'wiki' ? 600 : 500, fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>
            WIKI
          </button>
        </div>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'

export default function ModelHeader({ model, breadcrumbs = [], leftLink = '/dashboard', rightContent }) {
  const panelStyle = {
    background: 'rgba(12, 12, 16, 0.88)',
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
    backdropFilter: 'blur(6px)',
  }

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', zIndex: 20, pointerEvents: 'none' }}>
      <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '12px', ...panelStyle, padding: '8px 14px' }}>
        <Link to={leftLink} style={{ color: '#4fc3f7', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>3dFiler</Link>
        <div style={{ width: '1px', height: '20px', background: '#2a2a2a' }} />
        <div>
          {breadcrumbs.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px', flexWrap: 'wrap' }}>
              {breadcrumbs.map((crumb, idx) => (
                <span key={crumb.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {idx > 0 && <span style={{ color: '#555', fontSize: '0.7rem' }}>/</span>}
                  <span style={{ color: idx === breadcrumbs.length - 1 ? '#e0e0e0' : '#4fc3f7', fontSize: '0.7rem', fontWeight: idx === breadcrumbs.length - 1 ? 600 : 400 }}>
                    {crumb.title}
                  </span>
                </span>
              ))}
            </div>
          )}
          <h1 style={{ color: '#e0e0e0', fontSize: '0.95rem', margin: 0, fontWeight: 600, lineHeight: 1.2 }}>{model?.title || 'Model'}</h1>
          {model?.description && <p style={{ color: '#777', fontSize: '0.75rem', margin: '2px 0 0', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{model.description}</p>}
        </div>
      </div>
      {rightContent}
    </div>
  )
}

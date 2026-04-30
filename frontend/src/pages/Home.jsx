import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Link as LinkIcon, Box, MapPin, FileText, Globe, Cpu, Layers, Share2, Zap, Upload,
  Hexagon, ChevronDown
} from 'lucide-react'

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="card-modern" style={{ padding: '1.75rem', textAlign: 'left', borderLeft: '3px solid var(--primary)' }}>
      <div style={{
        width: 44, height: 44, borderRadius: 'var(--radius-sm)',
        background: 'rgba(185, 28, 28, 0.08)', border: '1px solid var(--border-accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
      }}>
        <Icon size={22} color="var(--primary)" strokeWidth={2} />
      </div>
      <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{desc}</p>
    </div>
  )
}

function Home() {
  const [recent, setRecent] = useState([])

  useEffect(() => {
    setRecent(JSON.parse(localStorage.getItem('recentModels') || '[]'))
  }, [])

  return (
    <div>
      {/* ── HERO ── */}
      <div style={{
        position: 'relative',
        minHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '2rem',
        background: '#ffffff',
        overflow: 'hidden'
      }}>
        {/* Decorative top bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: 'linear-gradient(90deg, transparent, var(--primary), transparent)'
        }} />

        {/* Subtle background pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 20% 30%, rgba(185,28,28,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(185,28,28,0.03) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />

        {/* Brand badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
          padding: '0.45rem 1.2rem', borderRadius: '999px',
          border: '1.5px solid var(--border-accent)',
          background: 'rgba(185, 28, 28, 0.04)',
          marginBottom: '2rem'
        }}>
          <Hexagon size={16} color="var(--primary)" strokeWidth={2.5} />
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 700,
            color: 'var(--primary)', letterSpacing: '3px', textTransform: 'uppercase'
          }}>
            3D Filer
          </span>
          <span style={{ width: 1, height: 14, background: 'var(--border-accent)' }} />
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)',
            letterSpacing: '1px', textTransform: 'uppercase'
          }}>
            Knowledge Base Platform
          </span>
        </div>

        {/* Main headline */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: '2px',
          color: 'var(--text-primary)',
          marginBottom: '1.25rem',
          maxWidth: '900px'
        }}>
          ANNOTATE YOUR
          <br />
          <span style={{ color: 'var(--primary)' }}>3D REALITY</span>
        </h1>

        {/* Subheadline */}
        <p style={{
          fontSize: 'clamp(1rem, 1.4vw, 1.25rem)',
          color: 'var(--text-secondary)',
          maxWidth: '580px',
          margin: '0 auto 2.5rem',
          lineHeight: 1.7
        }}>
          Upload 3D models, place interactive points of interest directly on geometry,
          and build searchable wiki pages. The mission control for spatial knowledge.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
          <Link to="/search" className="btn-primary" style={{ padding: '0.85rem 1.8rem', fontSize: '0.9rem' }}>
            <Globe size={18} />
            Explore Models
            <LinkIcon size={14} />
          </Link>
          <Link to="/upload" className="btn-ghost" style={{ padding: '0.85rem 1.8rem', fontSize: '0.9rem' }}>
            <Upload size={18} />
            Upload Model
          </Link>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
          color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
          letterSpacing: '1px', textTransform: 'uppercase'
        }}>
          <span>Scroll</span>
          <ChevronDown size={18} />
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--primary)',
            textTransform: 'uppercase', letterSpacing: '2px'
          }}>// Capabilities</span>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            fontWeight: 700, marginTop: '0.75rem', marginBottom: '0.5rem'
          }}>
            Mission Control Features
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto', fontSize: '0.95rem' }}>
            Everything you need to build interactive 3D knowledge bases.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <FeatureCard icon={Box} title="Multi-Format 3D Viewer" desc="Native support for GLB, GLTF, OBJ, FBX, and STL. Auto-center, auto-scale, and one-click camera focus." />
          <FeatureCard icon={MapPin} title="Spatial POI System" desc="Double-click anywhere on your model to drop points of interest. Link them to wiki articles and nested models." />
          <FeatureCard icon={FileText} title="Markdown Wiki Pages" desc="Every model gets a dedicated wiki page with markdown support, auto-generated tables of contents, and backlink tracking." />
          <FeatureCard icon={Layers} title="Nested Model Navigation" desc="Create hyperlinked 3D experiences. Jump from one model to another through POIs with breadcrumb trails." />
          <FeatureCard icon={Cpu} title="Keyboard Shortcuts" desc="Power-user controls: focus, reset, wireframe toggle, auto-rotate, screenshots, and POI navigation with single keys." />
          <FeatureCard icon={Share2} title="Publish & Share" desc="Publish models publicly, generate share links, and explore the community's 3D knowledge graph." />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '5rem 2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--primary)',
            textTransform: 'uppercase', letterSpacing: '2px'
          }}>// Workflow</span>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            fontWeight: 700, marginTop: '0.75rem'
          }}>
            Three-Step Deployment
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {[
            { step: '01', title: 'Upload', desc: 'Drag and drop your 3D model. Supported formats auto-detect.' },
            { step: '02', title: 'Annotate', desc: 'Double-click on the geometry to place POIs with titles, content, and nested links.' },
            { step: '03', title: 'Publish', desc: 'Toggle public visibility, write wiki articles, and share your model link.' },
          ].map((item) => (
            <div key={item.step} style={{
              textAlign: 'center', padding: '2.5rem 2rem',
              border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: '4rem', fontWeight: 800,
                color: 'rgba(185, 28, 28, 0.08)', position: 'absolute',
                top: '0.5rem', left: '1rem', lineHeight: 1
              }}>
                {item.step}
              </div>
              <Zap size={28} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.9 }} strokeWidth={2} />
              <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── RECENTLY VIEWED ── */}
      {recent.length > 0 && (
        <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--primary)',
              textTransform: 'uppercase', letterSpacing: '2px'
            }}>// Recent Activity</span>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginTop: '0.5rem'
            }}>
              Previously Viewed
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {recent.map((m) => (
              <Link key={m.id} to={`/model/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card-modern" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-tertiary)', border: '1px solid var(--border-medium)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Box size={20} color="var(--primary)" />
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{
                      fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {m.title}
                    </div>
                    <div style={{
                      fontSize: '0.7rem', color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)', textTransform: 'uppercase'
                    }}>
                      {m.extension}
                    </div>
                  </div>
                  <LinkIcon size={16} color="var(--text-muted)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <div style={{
          maxWidth: '640px', margin: '0 auto', padding: '3.5rem 2.5rem',
          border: '1.5px solid var(--border-accent)', borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, rgba(185,28,28,0.04), rgba(0,0,0,0.02))',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, transparent, var(--primary), transparent)'
          }} />
          <Hexagon size={36} color="var(--primary)" strokeWidth={1.5} style={{ marginBottom: '1rem', opacity: 0.9 }} />
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem, 3vw, 2rem)',
            fontWeight: 700, marginBottom: '0.75rem'
          }}>
            Ready to Launch?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
            Start building your 3D knowledge base today. Upload your first model and see the difference.
          </p>
          <Link to="/upload" className="btn-primary" style={{ padding: '0.9rem 2.2rem', fontSize: '0.95rem' }}>
            <Zap size={18} />
            Begin Mission
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '2.5rem 2rem', textAlign: 'center', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem'
        }}>
          <Hexagon size={16} color="var(--text-muted)" />
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 700,
            color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase'
          }}>
            3D Filer
          </span>
        </div>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '1px'
        }}>
          3D WIKI KNOWLEDGE BASE // BUILT FOR SPATIAL LEARNING
        </p>
      </footer>
    </div>
  )
}

export default Home

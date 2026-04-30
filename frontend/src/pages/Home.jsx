import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { Link as LinkIcon, Box, MapPin, FileText, Globe, Cpu, Layers, Share2, Zap, Upload } from 'lucide-react'
import LandingScene from '../components/LandingScene'

function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef()
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    const duration = 2000
    const steps = 60
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [isInView, target])

  return (
    <span ref={ref} style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, color: 'var(--neon-cyan)' }}>
      {count}{suffix}
    </span>
  )
}

function FeatureCard({ icon: Icon, title, desc, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="card-modern holo-border"
      style={{ padding: '1.75rem', textAlign: 'left' }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'rgba(0, 229, 255, 0.08)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
        <Icon size={20} color="var(--neon-cyan)" />
      </div>
      <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
    </motion.div>
  )
}

function StatBox({ value, label, suffix }) {
  return (
    <div className="stat-box">
      <div className="value"><AnimatedCounter target={value} suffix={suffix} /></div>
      <div className="label">{label}</div>
    </div>
  )
}

function Home() {
  const [recent, setRecent] = useState([])

  useEffect(() => {
    setRecent(JSON.parse(localStorage.getItem('recentModels') || '[]'))
  }, [])

  return (
    <div style={{ position: 'relative' }}>
      {/* Hero Section */}
      <div style={{ position: 'relative', minHeight: '92vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
        <LandingScene />

        {/* Hero Content */}
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '2rem', maxWidth: '900px' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 1rem', borderRadius: '999px', border: '1px solid var(--border-accent)', background: 'rgba(0, 229, 255, 0.05)', marginBottom: '1.5rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--neon-cyan)', boxShadow: '0 0 8px var(--neon-cyan)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--neon-cyan)', letterSpacing: '1px', textTransform: 'uppercase' }}>3D Wiki Knowledge Base Platform</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '2px', marginBottom: '1rem' }}
          >
            <span className="text-gradient">ANNOTATE</span> YOUR
            <br />
            <span style={{ color: 'var(--text-primary)', textShadow: '0 0 30px rgba(0, 229, 255, 0.3)' }}>3D REALITY</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto 2rem', lineHeight: 1.7 }}
          >
            Upload 3D models, place interactive points of interest directly on geometry, and build searchable wiki pages. The mission control for spatial knowledge.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}
          >
            <Link to="/search" className="btn-primary">
              <Globe size={16} />
              Explore Models
              <LinkIcon size={14} />
            </Link>
            <Link to="/upload" className="btn-ghost">
              <Upload size={16} />
              Upload Model
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}
          >
            <StatBox value={500} suffix="+" label="Models Hosted" />
            <StatBox value={2500} suffix="+" label="POIs Created" />
            <StatBox value={12} suffix="" label="File Formats" />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '1px', textTransform: 'uppercase' }}
        >
          <span>Scroll</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
        </motion.div>
      </div>

      {/* Features Section */}
      <section style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--neon-cyan)', textTransform: 'uppercase', letterSpacing: '2px' }}>// Capabilities</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 700, marginTop: '0.75rem', marginBottom: '0.5rem' }}>
            Mission Control Features
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto', fontSize: '0.95rem' }}>
            Everything you need to build interactive 3D knowledge bases.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <FeatureCard icon={Box} title="Multi-Format 3D Viewer" desc="Native support for GLB, GLTF, OBJ, FBX, and STL. Auto-center, auto-scale, and one-click camera focus." delay={0} />
          <FeatureCard icon={MapPin} title="Spatial POI System" desc="Double-click anywhere on your model to drop points of interest. Link them to wiki articles and nested models." delay={0.1} />
          <FeatureCard icon={FileText} title="Markdown Wiki Pages" desc="Every model gets a dedicated wiki page with markdown support, auto-generated tables of contents, and backlink tracking." delay={0.2} />
          <FeatureCard icon={Layers} title="Nested Model Navigation" desc="Create hyperlinked 3D experiences. Jump from one model to another through POIs with breadcrumb trails." delay={0.3} />
          <FeatureCard icon={Cpu} title="Keyboard Shortcuts" desc="Power-user controls: focus, reset, wireframe toggle, auto-rotate, screenshots, and POI navigation with single keys." delay={0.4} />
          <FeatureCard icon={Share2} title="Publish & Share" desc="Publish models publicly, generate share links, and explore the community's 3D knowledge graph." delay={0.5} />
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '4rem 2rem', maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--neon-cyan)', textTransform: 'uppercase', letterSpacing: '2px' }}>// Workflow</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 700, marginTop: '0.75rem' }}>
            Three-Step Deployment
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          {[
            { step: '01', title: 'Upload', desc: 'Drag and drop your 3D model. Supported formats auto-detect.' },
            { step: '02', title: 'Annotate', desc: 'Double-click on the geometry to place POIs with titles, content, and nested links.' },
            { step: '03', title: 'Publish', desc: 'Toggle public visibility, write wiki articles, and share your model link.' },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              style={{ textAlign: 'center', padding: '2rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 800, color: 'rgba(0, 229, 255, 0.1)', position: 'absolute', top: '0.5rem', left: '1rem', lineHeight: 1 }}>{item.step}</div>
              <Zap size={28} color="var(--neon-cyan)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
              <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{item.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recently Viewed */}
      {recent.length > 0 && (
        <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ marginBottom: '1.5rem' }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--neon-cyan)', textTransform: 'uppercase', letterSpacing: '2px' }}>// Recent Activity</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginTop: '0.5rem' }}>Previously Viewed</h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {recent.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <Link to={`/model/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="card-modern" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Box size={20} color="var(--neon-cyan)" />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{m.extension}</div>
                    </div>
                    <LinkIcon size={16} color="var(--text-muted)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section style={{ padding: '6rem 2rem', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.05), rgba(168, 85, 247, 0.05))', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, var(--neon-cyan), transparent)' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', fontWeight: 700, marginBottom: '1rem' }}>
            Ready to Launch?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Start building your 3D knowledge base today. Upload your first model and see the difference.
          </p>
          <Link to="/upload" className="btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '0.9rem' }}>
            <Zap size={18} />
            Begin Mission
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--border-subtle)', position: 'relative', zIndex: 10 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>
          3DFILER // 3D WIKI KNOWLEDGE BASE // BUILT FOR HACKATHONS
        </p>
      </footer>
    </div>
  )
}

export default Home

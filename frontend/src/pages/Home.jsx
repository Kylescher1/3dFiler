import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Link as LinkIcon, Box, MapPin, FileText, Globe, Cpu, Layers, Share2, Zap, Upload,
  Hexagon, ArrowDown, ArrowRight
} from 'lucide-react'

// ── Reuse animation helpers ──
function RevealText({ children, delay = 0, as: Tag = 'div', style = {} }) {
  const words = children.split(' ')
  return (
    <Tag style={style}>
      {words.map((word, i) => (
        <span key={i} style={{ display: 'inline-block', overflow: 'hidden', marginRight: '0.3em' }}>
          <motion.span
            initial={{ y: '100%' }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: delay + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'inline-block' }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}

function FadeUp({ children, delay = 0, style = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

function LineReveal({ delay = 0 }) {
  return (
    <motion.div
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ height: 1, background: 'var(--primary)', transformOrigin: 'left' }}
    />
  )
}

// ── Cutaway divider ──
function Cutaway({ color = '#ffffff' }) {
  return (
    <div style={{ height: 0, position: 'relative', zIndex: 5 }}>
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 60, marginTop: -1 }}>
        <polygon fill={color} points="0,60 1440,60 1440,0 0,60" />
      </svg>
    </div>
  )
}

// ── Feature card ──
function FeatureCard({ icon: Icon, title, desc, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      style={{
        padding: '2.5rem',
        border: '1px solid var(--border-subtle)',
        background: 'var(--bg-card)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--primary)', transformOrigin: 'left' }}
      />
      <Icon size={28} color="var(--primary)" strokeWidth={1.5} style={{ marginBottom: '1.5rem' }} />
      <h3 style={{
        fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700,
        letterSpacing: '1px', textTransform: 'uppercase',
        color: 'var(--text-primary)', marginBottom: '0.75rem'
      }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{desc}</p>
    </motion.div>
  )
}

// ── Animated counter stat ──
function AnimatedStat({ value, label, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ textAlign: 'center' }}
    >
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
        fontWeight: 800,
        color: 'var(--text-primary)',
        lineHeight: 1,
        letterSpacing: '2px'
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.65rem',
        color: '#888',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        marginTop: '0.5rem'
      }}>
        {label}
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════
export default function Home() {
  const [recent, setRecent] = useState([])
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150])

  useEffect(() => {
    setRecent(JSON.parse(localStorage.getItem('recentModels') || '[]'))
  }, [])

  return (
    <div>
      {/* ═══════ HERO ═══════ */}
      <div ref={heroRef} style={{
        position: 'relative',
        minHeight: '100vh',
        background: '#111111',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 4vw',
        overflow: 'hidden'
      }}>
        {/* ── Background graphics layer ── */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
          {/* Dot grid */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(185,28,28,0.12) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: 0.4
          }} />

          {/* Enormous ghost "3D" behind everything */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '40%',
            transform: 'translate(-50%, -50%)',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(20rem, 45vw, 55rem)',
            fontWeight: 900,
            color: 'rgba(0,0,0,0.03)',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none'
          }}>
            3D
          </div>

          {/* Large wireframe icosahedron — right side */}
          <svg style={{ position: 'absolute', right: '-5%', top: '10%', width: '45vw', height: '45vw', opacity: 0.12 }} viewBox="0 0 400 400" fill="none">
            <g stroke="var(--primary)" strokeWidth="0.8">
              <circle cx="200" cy="200" r="180" strokeDasharray="4 8" opacity="0.5" />
              <circle cx="200" cy="200" r="140" strokeDasharray="2 6" opacity="0.3" />
              <polygon points="200,40 340,130 340,270 200,360 60,270 60,130" />
              <polygon points="200,40 340,130 200,200 60,130" />
              <polygon points="200,360 340,270 200,200 60,270" />
              <line x1="200" y1="40" x2="200" y2="200" />
              <line x1="340" y1="130" x2="200" y2="200" />
              <line x1="340" y1="270" x2="200" y2="200" />
              <line x1="200" y1="360" x2="200" y2="200" />
              <line x1="60" y1="270" x2="200" y2="200" />
              <line x1="60" y1="130" x2="200" y2="200" />
              <polygon points="200,100 280,160 250,250 150,250 120,160" opacity="0.6" />
            </g>
          </svg>

          {/* Floating wiki-card rectangles with connection lines — upper middle-right */}
          <svg style={{ position: 'absolute', right: '12%', top: '18%', width: 280, height: 240, opacity: 0.15 }} viewBox="0 0 320 280" fill="none">
            <rect x="40" y="20" width="110" height="70" rx="4" stroke="var(--primary)" strokeWidth="1" />
            <line x1="55" y1="40" x2="135" y2="40" stroke="var(--primary)" strokeWidth="0.5" opacity="0.5" />
            <line x1="55" y1="55" x2="110" y2="55" stroke="var(--primary)" strokeWidth="0.5" opacity="0.5" />
            <line x1="55" y1="70" x2="95" y2="70" stroke="var(--primary)" strokeWidth="0.5" opacity="0.5" />
            <rect x="170" y="90" width="90" height="60" rx="4" stroke="var(--primary)" strokeWidth="1" />
            <line x1="185" y1="110" x2="245" y2="110" stroke="var(--primary)" strokeWidth="0.5" opacity="0.5" />
            <line x1="185" y1="125" x2="230" y2="125" stroke="var(--primary)" strokeWidth="0.5" opacity="0.5" />
            <rect x="90" y="170" width="100" height="55" rx="4" stroke="var(--primary)" strokeWidth="1" />
            <line x1="105" y1="190" x2="175" y2="190" stroke="var(--primary)" strokeWidth="0.5" opacity="0.5" />
            <line x1="105" y1="205" x2="160" y2="205" stroke="var(--primary)" strokeWidth="0.5" opacity="0.5" />
            <line x1="95" y1="90" x2="175" y2="110" stroke="var(--primary)" strokeWidth="0.6" strokeDasharray="4 4" />
            <line x1="210" y1="150" x2="170" y2="180" stroke="var(--primary)" strokeWidth="0.6" strokeDasharray="4 4" />
            <circle cx="95" cy="90" r="3" fill="var(--primary)" />
            <circle cx="175" cy="110" r="3" fill="var(--primary)" />
            <circle cx="210" cy="150" r="3" fill="var(--primary)" />
            <circle cx="170" cy="180" r="3" fill="var(--primary)" />
          </svg>

          {/* Concentric hexagon rings — left side */}
          <svg style={{ position: 'absolute', left: '-3%', bottom: '5%', width: '35vw', height: '35vw', opacity: 0.08 }} viewBox="0 0 400 400" fill="none">
            <g stroke="var(--primary)" strokeWidth="1">
              <polygon points="200,20 370,110 370,290 200,380 30,290 30,110" opacity="0.6" />
              <polygon points="200,60 330,130 330,270 200,340 70,270 70,130" opacity="0.4" />
              <polygon points="200,100 290,150 290,250 200,300 110,250 110,150" opacity="0.3" />
              <polygon points="200,140 250,170 250,230 200,260 150,230 150,170" opacity="0.2" />
              <line x1="200" y1="20" x2="200" y2="380" opacity="0.15" />
              <line x1="30" y1="110" x2="370" y2="290" opacity="0.15" />
              <line x1="370" y1="110" x2="30" y2="290" opacity="0.15" />
            </g>
          </svg>

          {/* Corner brackets */}
          <svg style={{ position: 'absolute', left: '4vw', top: '3rem', width: 80, height: 80, opacity: 0.25 }} viewBox="0 0 80 80" fill="none" stroke="var(--primary)" strokeWidth="1.5">
            <polyline points="0,30 0,0 30,0" />
          </svg>
          <svg style={{ position: 'absolute', right: '4vw', bottom: '6rem', width: 80, height: 80, opacity: 0.25 }} viewBox="0 0 80 80" fill="none" stroke="var(--primary)" strokeWidth="1.5">
            <polyline points="80,50 80,80 50,80" />
          </svg>
        </div>

        {/* ── Main centered content ── */}
        <motion.div
          style={{ opacity: heroOpacity, y: heroY, position: 'relative', zIndex: 2, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
        >
          {/* Eyebrow */}
          <FadeUp delay={0.2}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ width: 40, height: 1, background: 'var(--primary)' }} />
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#666',
                letterSpacing: '3px', textTransform: 'uppercase'
              }}>
                The Free 3D Knowledge Base
              </span>
              <div style={{ width: 40, height: 1, background: 'var(--primary)' }} />
            </div>
          </FadeUp>

          {/* Massive centered brand title */}
          <div style={{ marginBottom: '1.5rem' }}>
            <RevealText
              as="h1"
              delay={0.3}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(4rem, 12vw, 11rem)',
                fontWeight: 900,
                lineHeight: 1.0,
                letterSpacing: '10px',
                color: '#ffffff',
                textTransform: 'uppercase'
              }}
            >
              3D FILER
            </RevealText>
          </div>

          {/* Tagline */}
          <FadeUp delay={0.6}>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(0.9rem, 2vw, 1.4rem)',
              color: 'var(--primary)',
              letterSpacing: '5px',
              textTransform: 'uppercase',
              marginBottom: '3rem',
              fontWeight: 600
            }}>
              Upload · Annotate · Wiki
            </p>
          </FadeUp>

          {/* Larger centered description paragraph */}
          <FadeUp delay={0.8}>
            <p style={{
              fontSize: 'clamp(1.2rem, 2.2vw, 1.6rem)',
              color: '#bbb',
              maxWidth: 760,
              lineHeight: 1.8,
              marginBottom: '3.5rem',
              fontWeight: 300,
              textAlign: 'center'
            }}>
              Turn 3D models into interactive knowledge bases.
              Drop points of interest directly on geometry, write rich wiki pages, and link spatial data across models.
              A living encyclopedia for the three-dimensional world.
            </p>
          </FadeUp>

          {/* Wikipedia-style prominent search bar */}
          <FadeUp delay={1.0}>
            <div style={{ width: '100%', maxWidth: 680, marginBottom: '2.5rem' }}>
              <Link to="/search" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(185,28,28,0.5)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                }}
                >
                  <div style={{
                    flex: 1,
                    padding: '1.25rem 1.5rem',
                    color: '#777',
                    fontFamily: 'var(--font-body)',
                    fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)',
                    textAlign: 'left'
                  }}>
                    Search models, wiki pages, or topics...
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 1.5rem',
                    background: 'var(--primary)',
                    color: 'var(--text-primary)'
                  }}>
                    <ArrowRight size={20} />
                  </div>
                </div>
              </Link>
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                color: '#444',
                letterSpacing: '1px',
                marginTop: '0.75rem',
                textTransform: 'uppercase'
              }}>
                Popular: GLB · GLTF · Spatial Annotation · Nested Models
              </p>
            </div>
          </FadeUp>

          {/* CTAs */}
          <FadeUp delay={1.2}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link to="/search" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                padding: '1rem 2rem', background: 'var(--primary)', color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '2px',
                textTransform: 'uppercase', textDecoration: 'none', fontWeight: 600
              }}>
                Explore Models
                <ArrowRight size={14} />
              </Link>
              <Link to="/upload" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                padding: '1rem 2rem', background: 'transparent', color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '2px',
                textTransform: 'uppercase', textDecoration: 'none', fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                Upload Model
              </Link>
            </div>
          </FadeUp>

          {/* Bottom stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.4 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'clamp(2rem, 5vw, 4rem)',
              flexWrap: 'wrap',
              marginTop: '5rem'
            }}
          >
            <AnimatedStat value="5+" label="3D Formats" delay={1.5} />
            <AnimatedStat value="∞" label="Wiki Pages" delay={1.6} />
            <AnimatedStat value="3D" label="POI System" delay={1.7} />
          </motion.div>
      </div>

      <Cutaway color="#ffffff" />

      {/* ═══════ WHAT IS 3D FILER ═══════ */}
      <section style={{ padding: '8rem 4vw', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
        <FadeUp>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--primary)',
            letterSpacing: '3px', textTransform: 'uppercase', display: 'block', marginBottom: '2rem'
          }}>
            // What is 3D Filer
          </span>
        </FadeUp>

        <div style={{ maxWidth: 1200 }}>
          <RevealText
            as="h2"
            delay={0}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.8rem, 4.5vw, 3.5rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '2px',
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              marginBottom: '3rem',
              maxWidth: 900
            }}
          >
            A wiki knowledge base built on top of 3D geometry
          </RevealText>

          <LineReveal delay={0.3} />

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '3rem',
            marginTop: '3rem'
          }}>
            {[
              {
                title: 'Spatial Annotation',
                body: 'Double-click anywhere on a 3D model to drop a point of interest. Add titles, rich content, and link to other models or wiki pages.'
              },
              {
                title: 'Linked Knowledge',
                body: 'Every POI connects to wiki articles with markdown support, auto-generated TOCs, and bidirectional backlink tracking.'
              },
              {
                title: 'Nested Navigation',
                body: 'Jump between models through spatial links. Build explorable 3D knowledge graphs with full breadcrumb trails.'
              }
            ].map((item, i) => (
              <FadeUp key={item.title} delay={0.2 + i * 0.15}>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 700,
                    color: 'var(--primary)', letterSpacing: '2px', textTransform: 'uppercase',
                    marginBottom: '1rem'
                  }}>
                    {item.title}
                  </div>
                  <p style={{ fontSize: '0.95rem', color: '#555', lineHeight: 1.7 }}>
                    {item.body}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <Cutaway color="var(--bg-secondary)" />

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section style={{ padding: '8rem 4vw', background: 'var(--bg-primary)', position: 'relative' }}>
        <FadeUp>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--primary)',
            letterSpacing: '3px', textTransform: 'uppercase', display: 'block', marginBottom: '4rem'
          }}>
            // Workflow
          </span>
        </FadeUp>

        <div style={{ maxWidth: 1200, display: 'flex', flexDirection: 'column', gap: '4rem' }}>
          {[
            {
              num: '01',
              title: 'Upload',
              desc: 'Drag and drop GLB, GLTF, OBJ, FBX, or STL files. Formats auto-detect and models auto-center in the viewer.'
            },
            {
              num: '02',
              title: 'Annotate',
              desc: 'Place POIs directly on geometry. Write markdown content, choose colors, and set visibility. Every annotation is queryable.'
            },
            {
              num: '03',
              title: 'Publish',
              desc: 'Toggle public visibility, generate share links, and explore the community knowledge graph. Your 3D data becomes searchable.'
            }
          ].map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'clamp(80px, 12vw, 140px) 1fr',
                gap: '2rem',
                alignItems: 'start'
              }}
            >
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(3rem, 6vw, 5rem)',
                fontWeight: 900,
                color: 'rgba(185,28,28,0.25)',
                lineHeight: 1
              }}>
                {step.num}
              </div>
              <div>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  marginBottom: '0.75rem'
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontSize: '0.95rem',
                  color: '#888',
                  lineHeight: 1.7,
                  maxWidth: 500
                }}>
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <Cutaway color="#ffffff" />

      {/* ═══════ FEATURES ═══════ */}
      <section style={{ padding: '8rem 4vw', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <FadeUp>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--primary)',
              letterSpacing: '3px', textTransform: 'uppercase', display: 'block', marginBottom: '1.5rem'
            }}>
              // Capabilities
            </span>
          </FadeUp>

          <RevealText
            as="h2"
            delay={0}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.8rem, 4vw, 3rem)',
              fontWeight: 800,
              letterSpacing: '2px',
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              marginBottom: '4rem'
            }}
          >
            Everything You Need
          </RevealText>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            <FeatureCard icon={Box} title="Multi-Format 3D Viewer" desc="Native GLB, GLTF, OBJ, FBX, and STL support. Auto-center, auto-scale, and one-click camera focus." index={0} />
            <FeatureCard icon={MapPin} title="Spatial POI System" desc="Drop points of interest anywhere on geometry. Link to wiki articles and nested models." index={1} />
            <FeatureCard icon={FileText} title="Markdown Wiki Pages" desc="Rich markdown support, auto-generated TOCs, and full backlink tracking per model." index={2} />
            <FeatureCard icon={Layers} title="Nested Model Navigation" desc="Hyperlinked 3D experiences. Jump between models through POIs with breadcrumbs." index={3} />
            <FeatureCard icon={Cpu} title="Keyboard Shortcuts" desc="Focus, reset, wireframe, auto-rotate, screenshots, and POI navigation with single keys." index={4} />
            <FeatureCard icon={Share2} title="Publish & Explore" desc="Public visibility toggles, share links, and a searchable community knowledge graph." index={5} />
          </div>
        </div>
      </section>

      <Cutaway color="var(--bg-secondary)" />

      {/* ═══════ CTA ═══════ */}
      <section style={{ padding: '8rem 4vw', background: 'var(--bg-secondary)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(6rem, 15vw, 14rem)',
          fontWeight: 900,
          color: 'rgba(0,0,0,0.03)',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          letterSpacing: '10px'
        }}>
          3D Filer
        </div>

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 600, margin: '0 auto' }}>
          <FadeUp>
            <Hexagon size={40} color="var(--primary)" strokeWidth={1.2} style={{ marginBottom: '2rem', opacity: 0.9 }} />
          </FadeUp>

          <RevealText
            as="h2"
            delay={0.1}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)',
              fontWeight: 800,
              letterSpacing: '2px',
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              marginBottom: '1.25rem'
            }}
          >
            Start Building Your 3D Wiki
          </RevealText>

          <FadeUp delay={0.4}>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: 1.7 }}>
              Upload your first model and turn spatial data into searchable knowledge.
            </p>
          </FadeUp>

          <FadeUp delay={0.5}>
            <Link to="/upload" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '1.1rem 2.5rem',
              background: 'var(--primary)',
              color: '#ffffff',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              textDecoration: 'none',
              fontWeight: 600
            }}>
              <Zap size={16} />
              Begin
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer style={{
        padding: '2.5rem 4vw',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Hexagon size={14} color="var(--text-muted)" strokeWidth={2} />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}>
            3D Filer
          </span>
        </div>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem',
          color: '#444',
          letterSpacing: '1px',
          textTransform: 'uppercase'
        }}>
          3D Wiki Knowledge Base Platform
        </p>
      </footer>
    </div>
  )
}

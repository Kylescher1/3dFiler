import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Link as LinkIcon, Box, MapPin, FileText, Globe, Cpu, Layers, Share2, Zap, Upload,
  Hexagon, ArrowDown, ArrowRight
} from 'lucide-react'

// ── Staggered Word Reveal ──
function RevealText({ children, className = '', delay = 0, as: Tag = 'div' }) {
  const words = children.split(' ')
  return (
    <Tag className={className}>
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

function FadeUp({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
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

// ── Section Divider (Cutaway) ──
function Cutaway({ color = '#ffffff' }) {
  return (
    <div style={{ height: 0, position: 'relative', zIndex: 5 }}>
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 60, marginTop: -1 }}>
        <polygon fill={color} points="0,60 1440,60 1440,0 0,60" />
      </svg>
    </div>
  )
}

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
        fontFamily: 'var(--font-display)',
        fontSize: '1.1rem',
        fontWeight: 700,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        color: 'var(--text-primary)',
        marginBottom: '0.75rem'
      }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
        {desc}
      </p>
    </motion.div>
  )
}

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
      {/* ═══════════════════════════════════════════
          HERO — Dark, editorial, massive type
          ═══════════════════════════════════════════ */}
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
        {/* Subtle grid overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(185,28,28,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(185,28,28,0.03) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          pointerEvents: 'none'
        }} />

        <motion.div style={{ opacity: heroOpacity, y: heroY, position: 'relative', zIndex: 2, maxWidth: 1200 }}>
          {/* Eyebrow */}
          <FadeUp delay={0.2}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '3rem'
            }}>
              <div style={{ width: 40, height: 1, background: 'var(--primary)' }} />
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                color: '#888',
                letterSpacing: '3px',
                textTransform: 'uppercase'
              }}>
                3D Wiki Knowledge Base
              </span>
            </div>
          </FadeUp>

          {/* Massive headline */}
          <div style={{ marginBottom: '2.5rem' }}>
            <RevealText
              as="h1"
              delay={0.3}
              className=""
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.5rem, 7vw, 6.5rem)',
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: '3px',
                color: '#ffffff',
                textTransform: 'uppercase'
              }}
            >
              Upload Annotate Wiki
            </RevealText>
          </div>

          {/* Description */}
          <FadeUp delay={0.8}>
            <p style={{
              fontSize: 'clamp(1rem, 1.5vw, 1.3rem)',
              color: '#999',
              maxWidth: 520,
              lineHeight: 1.7,
              marginBottom: '3rem',
              fontWeight: 300
            }}>
              Turn 3D models into interactive knowledge bases.
              Drop points of interest, write wiki pages, and link spatial data.
            </p>
          </FadeUp>

          {/* CTAs */}
          <FadeUp delay={1.0}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/search" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '1rem 2rem',
                background: 'var(--primary)',
                color: '#fff',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                textDecoration: 'none',
                fontWeight: 600,
                border: 'none',
                transition: 'all 0.2s'
              }}>
                Explore Models
                <ArrowRight size={14} />
              </Link>
              <Link to="/upload" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '1rem 2rem',
                background: 'transparent',
                color: '#fff',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                textDecoration: 'none',
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.2)',
                transition: 'all 0.2s'
              }}>
                Upload Model
              </Link>
            </div>
          </FadeUp>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            bottom: '2.5rem',
            left: '4vw',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#555',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            zIndex: 2
          }}
        >
          <ArrowDown size={14} />
          Scroll
        </motion.div>

        {/* Large decorative number */}
        <div style={{
          position: 'absolute',
          bottom: '1rem',
          right: '4vw',
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(8rem, 20vw, 16rem)',
          fontWeight: 900,
          color: 'rgba(255,255,255,0.02)',
          lineHeight: 1,
          pointerEvents: 'none',
          zIndex: 1
        }}>
          3D
        </div>
      </div>

      <Cutaway color="#ffffff" />

      {/* ═══════════════════════════════════════════
          WHAT IS 3D FILER — White editorial section
          ═══════════════════════════════════════════ */}
      <section style={{ padding: '8rem 4vw', background: '#ffffff', position: 'relative', overflow: 'hidden' }}>
        <FadeUp>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--primary)',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '2rem'
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
              color: '#111',
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
                body: 'Every POI connects to wiki articles with markdown support, auto-generated tables of contents, and bidirectional backlink tracking.'
              },
              {
                title: 'Nested Navigation',
                body: 'Jump between models through spatial links. Build explorable 3D knowledge graphs with full breadcrumb trails.'
              }
            ].map((item, i) => (
              <FadeUp key={item.title} delay={0.2 + i * 0.15}>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    marginBottom: '1rem'
                  }}>
                    {item.title}
                  </div>
                  <p style={{
                    fontSize: '0.95rem',
                    color: '#555',
                    lineHeight: 1.7
                  }}>
                    {item.body}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <Cutaway color="#111111" />

      {/* ═══════════════════════════════════════════
          HOW IT WORKS — Dark, numbered steps
          ═══════════════════════════════════════════ */}
      <section style={{ padding: '8rem 4vw', background: '#111111', position: 'relative' }}>
        <FadeUp>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--primary)',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '4rem'
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
                  color: '#fff',
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

      {/* ═══════════════════════════════════════════
          FEATURES — White grid
          ═══════════════════════════════════════════ */}
      <section style={{ padding: '8rem 4vw', background: '#ffffff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <FadeUp>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--primary)',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '1.5rem'
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
              color: '#111',
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

      <Cutaway color="#111111" />

      {/* ═══════════════════════════════════════════
          CTA — Dark band
          ═══════════════════════════════════════════ */}
      <section style={{ padding: '8rem 4vw', background: '#111111', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(6rem, 15vw, 14rem)',
          fontWeight: 900,
          color: 'rgba(255,255,255,0.015)',
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
              color: '#fff',
              textTransform: 'uppercase',
              marginBottom: '1.25rem'
            }}
          >
            Start Building Your 3D Wiki
          </RevealText>

          <FadeUp delay={0.4}>
            <p style={{ fontSize: '1rem', color: '#888', marginBottom: '2.5rem', lineHeight: 1.7 }}>
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
              color: '#fff',
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

      {/* ═══════════════════════════════════════════
          FOOTER — Minimal
          ═══════════════════════════════════════════ */}
      <footer style={{
        padding: '2.5rem 4vw',
        background: '#0a0a0a',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Hexagon size={14} color="#555" strokeWidth={2} />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#555',
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

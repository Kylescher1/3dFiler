import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Hexagon, Home, AlertTriangle } from 'lucide-react'

function NotFound() {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', maxWidth: '500px' }}
      >
        <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-lg)', background: 'rgba(0, 229, 255, 0.05)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <AlertTriangle size={36} color="var(--neon-cyan)" />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '5rem', margin: 0, color: 'var(--neon-cyan)', lineHeight: 1, textShadow: '0 0 30px rgba(0, 229, 255, 0.3)' }}>404</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', margin: '1rem 0 2rem' }}>
          This asset does not exist in this dimension.
        </p>
        <Link to="/" className="btn-primary">
          <Home size={16} />
          Return to Base
        </Link>
      </motion.div>
    </div>
  )
}

export default NotFound

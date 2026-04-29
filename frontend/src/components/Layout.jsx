import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'
import { Box, Search, Library, Upload, LogOut, LogIn, UserPlus, Hexagon } from 'lucide-react'
import './Layout.css'

function NavLink({ to, icon: Icon, children }) {
  const location = useLocation()
  const isActive = location.pathname === to
  return (
    <Link to={to} className={isActive ? 'active' : ''}>
      <Icon size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
      {children}
    </Link>
  )
}

function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/search')
  }

  return (
    <motion.div
      className="app"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <nav className="navbar">
        <Link to="/" className="brand">
          <Hexagon size={28} strokeWidth={2.5} />
          <span>3DFILER</span>
        </Link>
        <div className="nav-links">
          <NavLink to="/search" icon={Search}>Explore</NavLink>
          {user ? (
            <>
              <NavLink to="/dashboard" icon={Library}>Library</NavLink>
              <NavLink to="/upload" icon={Upload}>Upload</NavLink>
              <span className="user-name">{user.username}</span>
              <button onClick={handleLogout} className="btn-link">
                <LogOut size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" icon={LogIn}>Login</NavLink>
              <NavLink to="/register" icon={UserPlus}>Register</NavLink>
            </>
          )}
        </div>
      </nav>
      <main>
        <motion.div
          key={useLocation().pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ height: '100%' }}
        >
          <Outlet />
        </motion.div>
      </main>
    </motion.div>
  )
}

export default Layout

import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Layout.css'

function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="app">
      <nav className="navbar">
        <Link to="/" className="brand">3dFiler</Link>
        <div className="nav-links">
          <Link to="/explore">Explore</Link>
          <Link to="/search">Search</Link>
          {user ? (
            <>
              <Link to="/dashboard">My Models</Link>
              <Link to="/upload">Upload</Link>
              <span className="user-name">{user.username}</span>
              <button onClick={logout} className="btn-link">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default Layout

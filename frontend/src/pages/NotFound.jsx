import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '6rem 1rem' }}>
      <h1 style={{ fontSize: '6rem', margin: 0, color: '#4fc3f7', lineHeight: 1 }}>404</h1>
      <p style={{ fontSize: '1.2rem', color: '#aaa', margin: '1rem 0 2rem' }}>
        This page does not exist in this dimension.
      </p>
      <Link to="/" className="btn">Go Home</Link>
    </div>
  )
}

export default NotFound

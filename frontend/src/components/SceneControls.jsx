import { useState, useRef } from 'react'
import './SceneControls.css'

const icons = {
  focus: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
    </svg>
  ),
  reset: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 20H4v-4h4v4zm0-6H4v-4h4v4zm0-6H4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4z"/>
    </svg>
  ),
  wireframe: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/>
      <path d="M4 6h16M4 10h16M4 14h16M4 18h16M8 6v12M12 6v12M16 6v12"/>
    </svg>
  ),
  rotate: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8A5.87 5.87 0 016 12c0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
    </svg>
  ),
  screenshot: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M9 3L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
    </svg>
  ),
  fullscreen: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
    </svg>
  ),
  bg: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M12 3a9 9 0 000 18 9 9 0 000-18zm0 16a7 7 0 110-14 7 7 0 010 14z"/>
    </svg>
  ),
}

export function SceneControls({
  onFocus,
  onReset,
  showGrid,
  setShowGrid,
  wireframe,
  setWireframe,
  autoRotate,
  setAutoRotate,
  onScreenshot,
  onFullscreen,
  bgDark,
  setBgDark,
  controlsRef,
}) {
  const [flash, setFlash] = useState(false)
  const containerRef = useRef()

  const handleScreenshot = () => {
    onScreenshot?.()
    setFlash(true)
    setTimeout(() => setFlash(false), 200)
  }

  return (
    <>
      {flash && <div className="screenshot-flash" />}
      <div className="scene-controls" ref={containerRef}>
        <div className="control-group">
          <button onClick={onFocus} title="Focus / Center Camera">
            {icons.focus}
          </button>
          <button onClick={onReset} title="Reset View">
            {icons.reset}
          </button>
        </div>

        <div className="control-divider" />

        <div className="control-group">
          <button onClick={() => setShowGrid(!showGrid)} className={showGrid ? 'active' : ''} title="Toggle Grid">
            {icons.grid}
          </button>
          <button onClick={() => setWireframe(!wireframe)} className={wireframe ? 'active' : ''} title="Toggle Wireframe">
            {icons.wireframe}
          </button>
          <button onClick={() => setAutoRotate(!autoRotate)} className={autoRotate ? 'active' : ''} title="Toggle Auto-Rotate">
            {icons.rotate}
          </button>
          <button onClick={() => setBgDark(!bgDark)} className={bgDark ? 'active' : ''} title="Toggle Background">
            {icons.bg}
          </button>
        </div>

        <div className="control-divider" />

        <div className="control-group">
          <button onClick={handleScreenshot} title="Take Screenshot">
            {icons.screenshot}
          </button>
          <button onClick={onFullscreen} title="Fullscreen">
            {icons.fullscreen}
          </button>
        </div>
      </div>
    </>
  )
}

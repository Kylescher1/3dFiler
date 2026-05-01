import { useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { Upload as UploadIcon, CloudUpload, FileBox, Tag, FileText, Check, LogIn, UserPlus, Grid3X3, Sun, Moon, RotateCw, Palette } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const DEFAULT_VIEWER_SETTINGS = {
  showGrid: true,
  showAxes: false,
  autoRotate: false,
  lightingPreset: 'neutral',
  backgroundColor: '#111111',
  sunIntensity: 1,
  sunRotation: 45
}

function ViewerSettingsPanel({ settings, onChange }) {
  const presets = [
    { key: 'neutral', label: 'Neutral', icon: Sun },
    { key: 'studio', label: 'Studio', icon: Palette },
    { key: 'dramatic', label: 'Dramatic', icon: Moon }
  ]

  const toggle = (key) => onChange({ ...settings, [key]: !settings[key] })

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Palette size={12} /> Viewer Settings
      </label>
      <div className="card-modern" style={{ padding: '1rem', border: '1px solid var(--border-subtle)', background: 'var(--bg-tertiary)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          <button type="button" onClick={() => toggle('showGrid')} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem',
            border: `1px solid ${settings.showGrid ? 'var(--primary)' : 'var(--border-subtle)'}`,
            background: settings.showGrid ? 'rgba(185,28,28,0.08)' : 'transparent',
            borderRadius: 'var(--radius-sm)', color: settings.showGrid ? 'var(--primary)' : 'var(--text-secondary)',
            fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s'
          }}>
            <Grid3X3 size={14} /> Grid Floor
          </button>
          <button type="button" onClick={() => toggle('showAxes')} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem',
            border: `1px solid ${settings.showAxes ? 'var(--primary)' : 'var(--border-subtle)'}`,
            background: settings.showAxes ? 'rgba(185,28,28,0.08)' : 'transparent',
            borderRadius: 'var(--radius-sm)', color: settings.showAxes ? 'var(--primary)' : 'var(--text-secondary)',
            fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s'
          }}>
            <Palette size={14} /> Axes
          </button>
          <button type="button" onClick={() => toggle('autoRotate')} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem',
            border: `1px solid ${settings.autoRotate ? 'var(--primary)' : 'var(--border-subtle)'}`,
            background: settings.autoRotate ? 'rgba(185,28,28,0.08)' : 'transparent',
            borderRadius: 'var(--radius-sm)', color: settings.autoRotate ? 'var(--primary)' : 'var(--text-secondary)',
            fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s'
          }}>
            <RotateCw size={14} /> Auto-Rotate
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {presets.map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" onClick={() => onChange({ ...settings, lightingPreset: key })} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              padding: '0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem',
              border: `1px solid ${settings.lightingPreset === key ? 'var(--primary)' : 'var(--border-subtle)'}`,
              background: settings.lightingPreset === key ? 'rgba(185,28,28,0.08)' : 'transparent',
              color: settings.lightingPreset === key ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all 0.2s'
            }}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
        {/* Sun Intensity */}
        <div style={{ marginBottom: '0.55rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            <span>Sun Intensity</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{settings.sunIntensity.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0}
            max={3}
            step={0.1}
            value={settings.sunIntensity}
            onChange={e => onChange({ ...settings, sunIntensity: parseFloat(e.target.value) })}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>
        {/* Sun Rotation */}
        <div style={{ marginBottom: '0.55rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            <span>Sun Rotation</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{settings.sunRotation}°</span>
          </div>
          <input
            type="range"
            min={0}
            max={360}
            step={5}
            value={settings.sunRotation}
            onChange={e => onChange({ ...settings, sunRotation: parseInt(e.target.value, 10) })}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>
      </div>
    </div>
  )
}

function Upload() {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [wikiTemplate, setWikiTemplate] = useState(true)
  const [viewerSettings, setViewerSettings] = useState(DEFAULT_VIEWER_SETTINGS)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { user } = useAuth()

  const handleFile = (f) => {
    if (!f) return
    const valid = ['.gltf', '.glb', '.obj', '.fbx', '.stl']
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase()
    if (!valid.includes(ext)) {
      setError(`Unsupported format: ${ext}. Use: GLTF, GLB, OBJ, FBX, STL`)
      return
    }
    setError('')
    setFile(f)
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''))
  }

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    handleFile(dropped)
  }, [title])

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const onDragLeave = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) { setError('Select a 3D model file'); return }

    setUploading(true)
    setProgress(0)
    const form = new FormData()
    form.append('model', file)
    form.append('title', title || file.name)
    form.append('description', description)
    form.append('tags', tags)
    form.append('viewerSettings', JSON.stringify(viewerSettings))

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API}/models`)
    xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`)

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      setUploading(false)
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText)
        if (wikiTemplate) {
          const template = `# ${title || file.name.replace(/\.[^/.]+$/, '')}\n\n## Overview\n${description || 'Describe what this model is, why it matters, and how it should be used.'}\n\n## Key Areas\nAdd points of interest in the 3D viewer, then reference them here with [[poi:...]].\n\n## Notes\n- Source file: ${file.name}\n- Tags: ${tags || 'none yet'}\n\n## Open Questions\n- What should be annotated next?\n`
          fetch(`${API}/models/${data.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ wikiContent: template })
          }).catch(() => {})
        }
        addToast('Upload complete!', 'success')
        navigate(`/model/${data.id}`)
      } else {
        let msg = 'Upload failed'
        try { msg = JSON.parse(xhr.responseText).error || msg } catch { msg = 'Upload failed' }
        setError(msg)
        addToast(msg, 'error')
      }
    })

    xhr.addEventListener('error', () => {
      setUploading(false)
      setError('Upload failed. Check your connection.')
      addToast('Upload failed. Check your connection.', 'error')
    })

    xhr.send(form)
  }

  if (!user) {
    return (
      <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>// Upload Interface</span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 700, marginTop: '0.35rem', marginBottom: '0.3rem' }}>
              Upload 3D Model
            </h1>
          </div>

          <div className="card-modern" style={{ padding: '2.5rem', textAlign: 'center', border: '1px solid var(--border-medium)' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: 'rgba(185,28,28,0.08)',
                border: '1px solid rgba(185,28,28,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}>
                <LogIn size={28} color="var(--primary)" />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Account Required
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 420, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
                You need to be signed in to upload 3D models and build your knowledge base.
                Create an account or log in to get started.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/login" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LogIn size={14} /> Log In
                </Link>
                <Link to="/register" className="btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserPlus size={14} /> Create Account
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>// Upload Interface</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 700, marginTop: '0.35rem', marginBottom: '0.3rem' }}>
            Upload 3D Model
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Deploy your 3D asset to the knowledge base.</p>
        </div>

        <div className="card-modern" style={{ padding: '1.5rem', border: '1px solid var(--border-medium)' }}>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              style={{
                border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border-medium)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '2.5rem',
                textAlign: 'center',
                background: dragOver ? 'rgba(185, 28, 28, 0.05)' : 'var(--bg-tertiary)',
                transition: 'all 0.3s ease',
                marginBottom: '1.5rem',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
              onClick={() => document.getElementById('file-input').click()}
            >
              {dragOver && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(185,28,28,0.05), transparent)', pointerEvents: 'none' }}
                />
              )}
              <input
                id="file-input"
                type="file"
                accept=".gltf,.glb,.obj,.fbx,.stl"
                style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files[0])}
              />
              <AnimatePresence mode="wait">
                {file ? (
                  <motion.div
                    key="file"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <FileBox size={36} color="var(--primary)" style={{ margin: '0 auto 0.75rem' }} />
                    <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '1.1rem', fontFamily: 'var(--font-mono)' }}>{file.name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.75rem' }}>Click or drop to replace</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <CloudUpload size={40} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Drag & drop a 3D model here</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.3rem' }}>or click to browse</p>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                      {['.gltf', '.glb', '.obj', '.fbx', '.stl'].map(ext => (
                        <span key={ext} className="tag-minimal" style={{ fontSize: '0.6rem' }}>{ext}</span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {uploading && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)', marginBottom: '0.4rem' }}>
                  <span>UPLOADING ASSET...</span>
                  <span>{progress}%</span>
                </div>
                <div style={{ width: '100%', height: 4, background: 'var(--bg-secondary)', borderRadius: 2, overflow: 'hidden' }}>
                  <motion.div
                    style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', borderRadius: 2 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileBox size={12} /> Asset Title
              </label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Turbofan Engine Assembly" />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={12} /> Description
              </label>
              <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this model? What do you want to document about it?" />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Tag size={12} /> Classification Tags
              </label>
              <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="aerospace, turbine, reference (comma separated)" />
            </div>

            <ViewerSettingsPanel settings={viewerSettings} onChange={setViewerSettings} />

            <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={wikiTemplate} onChange={e => setWikiTemplate(e.target.checked)} style={{ marginTop: '0.25rem', accentColor: 'var(--primary)' }} />
              <span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600, display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                  <Check size={14} style={{ verticalAlign: 'text-bottom', marginRight: '0.3rem' }} />
                  Generate starter wiki page
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4 }}>Creates a professional markdown outline so every upload starts as a usable wiki entry.</span>
              </span>
            </label>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', opacity: uploading ? 0.6 : 1, pointerEvents: uploading ? 'none' : 'auto' }}
            >
              <UploadIcon size={16} />
              {uploading ? 'DEPLOYING...' : 'DEPLOY ASSET'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default Upload

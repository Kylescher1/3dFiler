import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit3, Eye, Link2, MapPin, FileText, ChevronRight, Box, ExternalLink, Globe, Layers, Save, Undo2, Settings, Grid3X3, Sun, Moon, RotateCw, Palette } from 'lucide-react'
import MarkdownContent from '../components/MarkdownContent'
import ModelHeader from '../components/ModelHeader'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function normalizePoi(poi) {
  if (poi.positionX !== undefined) {
    return { ...poi, position: { x: poi.positionX, y: poi.positionY, z: poi.positionZ } }
  }
  return poi
}

/* Replace [[poi:<id>]] with markdown links before rendering */
function preprocessWikiWiki(content, pois) {
  if (!content) return ''
  const poiMap = new Map(pois.map(p => [p.id, p]))
  return content.replace(/\[\[poi:([a-zA-Z0-9-]+)\]\]/g, (match, poiId) => {
    const poi = poiMap.get(poiId)
    const label = poi ? poi.title : 'Unknown POI'
    return `[${label}](/model/${poi?.modelId || ''}?poi=${poiId})`
  })
}

/* Suggest-box for POI references while editing */
function PoiReferenceHelper({ pois, onInsert, visible, query }) {
  if (!visible || !query) return null
  const matches = pois.filter(p => p.title.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
  if (matches.length === 0) return null

  return (
    <div style={{
      position: 'absolute',
      zIndex: 100,
      background: 'var(--bg-card)',
      border: '1px solid var(--border-medium)',
      borderRadius: 'var(--radius-md)',
      padding: '4px 0',
      minWidth: '200px',
      boxShadow: 'var(--shadow-card)',
      backdropFilter: 'blur(12px)',
    }}>
      {matches.map(poi => (
        <button
          key={poi.id}
          onClick={() => onInsert(poi.id)}
          style={{
            display: 'block', width: '100%', textAlign: 'left',
            background: 'none', border: 'none', padding: '6px 12px',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{poi.title}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>[[poi:{poi.id}]]</span>
        </button>
      ))}
    </div>
  )
}

function WikiSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '100px 20px 60px' }}>
        <motion.div
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '4rem 0' }}
        >
          INITIALIZING WIKI...
        </motion.div>
      </div>
    </div>
  )
}

function ModelWiki() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [model, setModel] = useState(null)
  const [pois, setPois] = useState([])
  const [error, setError] = useState('')
  const [isOwner, setIsOwner] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editingSettings, setEditingSettings] = useState(false)
  const [draftWiki, setDraftWiki] = useState('')
  const [draftSettings, setDraftSettings] = useState({ showGrid: true, showAxes: false, autoRotate: false, lightingPreset: 'neutral', backgroundColor: '#111111' })
  const [saving, setSaving] = useState(false)
  const [suggestVisible, setSuggestVisible] = useState(false)
  const [suggestQuery, setSuggestQuery] = useState('')
  const textareaRef = useRef(null)
  const token = localStorage.getItem('token')

  useEffect(() => {
    setModel(null)
    setPois([])
    setError('')
    setEditing(false)

    const headers = {}
    if (token) headers.Authorization = `Bearer ${token}`

    fetch(`${API}/models/${id}`, { headers })
      .then(r => { if (!r.ok) throw new Error(r.status === 403 ? 'Private model' : 'Not found'); return r.json() })
      .then(data => {
        setModel(data)
        setPois((data.pois || []).map(normalizePoi))
        setDraftWiki(data.wikiContent || '')
        let vs = {}
        try { vs = JSON.parse(data.viewerSettings || '{}') } catch { vs = {} }
        setDraftSettings({
          showGrid: typeof vs.showGrid === 'boolean' ? vs.showGrid : true,
          showAxes: typeof vs.showAxes === 'boolean' ? vs.showAxes : false,
          autoRotate: typeof vs.autoRotate === 'boolean' ? vs.autoRotate : false,
          lightingPreset: vs.lightingPreset || 'neutral',
          backgroundColor: vs.backgroundColor || '#111111'
        })
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            setIsOwner(payload.userId === data.userId)
          } catch { setIsOwner(false) }
        }
      })
      .catch(err => setError(err.message))
  }, [id, token])

  const saveWiki = async () => {
    if (!isOwner) return
    setSaving(true)
    const res = await fetch(`${API}/models/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ wikiContent: draftWiki })
    })
    if (res.ok) {
      const data = await res.json()
      setModel(prev => ({ ...prev, wikiContent: data.wikiContent }))
      setEditing(false)
    }
    setSaving(false)
  }

  const saveSettings = async () => {
    if (!isOwner) return
    setSaving(true)
    const res = await fetch(`${API}/models/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ viewerSettings: JSON.stringify(draftSettings) })
    })
    if (res.ok) {
      setModel(prev => ({ ...prev, viewerSettings: JSON.stringify(draftSettings) }))
      setEditingSettings(false)
    }
    setSaving(false)
  }

  const handleTextareaChange = (e) => {
    const val = e.target.value
    setDraftWiki(val)
    const cursor = e.target.selectionStart
    const before = val.slice(0, cursor)
    const match = before.match(/\[\[poi:([^\]]*)$/)
    if (match) {
      setSuggestQuery(match[1])
      setSuggestVisible(true)
    } else {
      setSuggestVisible(false)
    }
  }

  const insertPoiRef = useCallback((poiId) => {
    if (!textareaRef.current) return
    const ta = textareaRef.current
    const cursor = ta.selectionStart
    const val = draftWiki
    const before = val.slice(0, cursor)
    const after = val.slice(cursor)
    const replacement = `[[poi:${poiId}]]`
    const match = before.match(/\[\[poi:([^\]]*)$/)
    if (match) {
      const newBefore = before.slice(0, before.length - match[0].length) + replacement
      const newVal = newBefore + after
      setDraftWiki(newVal)
      setSuggestVisible(false)
      setTimeout(() => {
        ta.focus()
        ta.selectionStart = ta.selectionEnd = newBefore.length
      }, 0)
    }
  }, [draftWiki])

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>
      ERROR: {error.toUpperCase()}
    </div>
  )

  if (!model) return <WikiSkeleton />

  const extension = model.originalName?.split('.').pop()?.toUpperCase()
  const processedWiki = preprocessWikiWiki(model.wikiContent, pois)
  const nestedModels = model.nestedModels || []
  const backlinks = model.backlinks || []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Top bar */}
      <ModelHeader
        model={model}
        mode="wiki"
        onOpenViewer={() => navigate(`/model/${id}`)}
        onOpenWiki={() => {}}
      />

      {/* Main content */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '82px 20px 60px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '28px' }}>
        {/* Left: Wiki content */}
        <div>
          {/* Title + actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: '1.7rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '0.5px' }}>{model.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                <span className="tag-minimal">{extension}</span>
                {model.published ? (
                  <span className="tag-minimal" style={{ color: 'var(--success)', borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.08)' }}>Published</span>
                ) : (
                  <span className="tag-minimal" style={{ color: 'var(--warning)', borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)' }}>Private</span>
                )}
                {(model.tags || []).map(t => (
                  <span key={t.id} className="tag-minimal" style={{ color: 'var(--primary)' }}>{t.name}</span>
                ))}
              </div>
            </div>
            {isOwner && !editing && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setEditing(true)}
                className="btn-ghost"
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', flexShrink: 0 }}
              >
                <Edit3 size={14} />
                Edit Wiki
              </motion.button>
            )}
          </motion.div>

          {/* Wiki body */}
          <AnimatePresence mode="wait">
            {editing ? (
              <motion.div
                key="editor"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                style={{ position: 'relative' }}
              >
                <div className="card-modern" style={{ padding: '1rem' }}>
                  <textarea
                    ref={textareaRef}
                    value={draftWiki}
                    onChange={handleTextareaChange}
                    rows={20}
                    style={{
                      width: '100%', padding: '16px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                      border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem',
                      lineHeight: 1.6, fontFamily: 'var(--font-mono)', resize: 'vertical',
                    }}
                    placeholder="# Welcome to the Wiki&#10;&#10;Write markdown here. Reference POIs with [[poi:poi-id]]."
                  />
                  <PoiReferenceHelper
                    pois={pois}
                    onInsert={insertPoiRef}
                    visible={suggestVisible}
                    query={suggestQuery}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => { setEditing(false); setDraftWiki(model.wikiContent || ''); setSuggestVisible(false) }}
                    className="btn-ghost"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                  >
                    <Undo2 size={14} />
                    Cancel
                  </button>
                  <button
                    onClick={saveWiki}
                    disabled={saving}
                    className="btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                  >
                    <Save size={14} />
                    {saving ? 'Saving...' : 'Save Wiki'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="reader"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="card-modern"
                style={{ padding: '28px' }}
              >
                {processedWiki.trim() ? (
                  <MarkdownContent content={processedWiki} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                    <FileText size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.95rem' }}>No wiki content yet.</p>
                    {isOwner && (
                      <button
                        onClick={() => setEditing(true)}
                        className="btn-primary"
                        style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}
                      >
                        <Edit3 size={14} />
                        Write the First Wiki Page
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Auto POI sections */}
          {pois.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              style={{ marginTop: '36px' }}
            >
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)', letterSpacing: '0.5px' }}>
                <MapPin size={18} />
                Points of Interest
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, fontFamily: 'var(--font-body)' }}>({pois.length})</span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {pois.map((poi, idx) => (
                  <motion.div
                    key={poi.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.35 }}
                    className="card-modern holo-border"
                    style={{ padding: '18px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <span style={{
                        background: 'var(--primary)', color: 'var(--bg-primary)', width: '26px', height: '26px',
                        borderRadius: '50%', fontSize: '12px', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        fontFamily: 'var(--font-mono)',
                      }}>{idx + 1}</span>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{poi.title}</h3>
                      <span className="tag-minimal" style={{ textTransform: 'capitalize', marginLeft: 'auto' }}>{poi.type}</span>
                    </div>
                    {poi.type === 'nested-model' && poi.content ? (
                      <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '10px' }}>This POI links to another model.</p>
                        <button
                          onClick={() => navigate(`/model/${poi.content}`)}
                          className="btn-ghost"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        >
                          <ExternalLink size={12} />
                          Open Nested Model
                        </button>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                        <MarkdownContent content={poi.content} />
                      </div>
                    )}
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => navigate(`/model/${id}?poi=${poi.id}`)}
                        className="btn-ghost"
                        style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}
                      >
                        <Eye size={12} />
                        View in 3D
                      </button>
                      {isOwner && editing && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', fontFamily: 'var(--font-mono)' }}>
                          Ref: <code style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px', color: 'var(--primary)' }}>[[poi:{poi.id}]]</code>
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick links */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="card-modern"
            style={{ padding: '18px' }}
          >
            <h4 style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'var(--font-mono)' }}>
              <Globe size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
              Quick Links
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link to={`/model/${id}`} className="btn-ghost" style={{ justifyContent: 'flex-start', padding: '0.5rem 0.7rem', fontSize: '0.8rem' }}>
                <Eye size={14} />
                Open 3D Viewer
                <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />
              </Link>
              {model.published && (
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/model/${id}`
                    navigator.clipboard.writeText(url).catch(() => {})
                  }}
                  className="btn-ghost"
                  style={{ justifyContent: 'flex-start', padding: '0.5rem 0.7rem', fontSize: '0.8rem' }}
                >
                  <Link2 size={14} />
                  Copy Share Link
                  <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                </button>
              )}
            </div>
          </motion.div>

          {/* Viewer Settings */}
          {isOwner && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="card-modern"
              style={{ padding: '18px' }}
            >
              <h4 style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'var(--font-mono)' }}>
                <Settings size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                Viewer Settings
              </h4>
              {!editingSettings ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <span>Grid Floor</span>
                    <span style={{ color: draftSettings.showGrid ? 'var(--success)' : 'var(--text-muted)' }}>{draftSettings.showGrid ? 'On' : 'Off'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <span>Axes</span>
                    <span style={{ color: draftSettings.showAxes ? 'var(--success)' : 'var(--text-muted)' }}>{draftSettings.showAxes ? 'On' : 'Off'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <span>Auto-Rotate</span>
                    <span style={{ color: draftSettings.autoRotate ? 'var(--success)' : 'var(--text-muted)' }}>{draftSettings.autoRotate ? 'On' : 'Off'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <span>Lighting</span>
                    <span style={{ textTransform: 'capitalize' }}>{draftSettings.lightingPreset}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <span>Background</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ width: 12, height: 12, borderRadius: 3, background: draftSettings.backgroundColor, border: '1px solid var(--border-subtle)', display: 'inline-block' }} />
                      {draftSettings.backgroundColor}
                    </span>
                  </div>
                  <button
                    onClick={() => setEditingSettings(true)}
                    className="btn-ghost"
                    style={{ justifyContent: 'center', padding: '0.4rem 0.7rem', fontSize: '0.78rem', marginTop: '0.5rem' }}
                  >
                    <Settings size={12} />
                    Edit Settings
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {[
                      { key: 'showGrid', label: 'Grid Floor', icon: Grid3X3 },
                      { key: 'showAxes', label: 'Axes', icon: Palette },
                      { key: 'autoRotate', label: 'Auto-Rotate', icon: RotateCw }
                    ].map(({ key, label, icon: Icon }) => (
                      <button key={key} type="button" onClick={() => setDraftSettings(s => ({ ...s, [key]: !s[key] }))} style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem',
                        border: `1px solid ${draftSettings[key] ? 'var(--primary)' : 'var(--border-subtle)'}`,
                        background: draftSettings[key] ? 'rgba(185,28,28,0.08)' : 'transparent',
                        borderRadius: 'var(--radius-sm)', color: draftSettings[key] ? 'var(--primary)' : 'var(--text-secondary)',
                        fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s'
                      }}>
                        <Icon size={12} /> {label}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {[
                      { key: 'neutral', label: 'Neutral', icon: Sun },
                      { key: 'studio', label: 'Studio', icon: Palette },
                      { key: 'dramatic', label: 'Dramatic', icon: Moon }
                    ].map(({ key, label, icon: Icon }) => (
                      <button key={key} type="button" onClick={() => setDraftSettings(s => ({ ...s, lightingPreset: key }))} style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                        padding: '0.4rem', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem',
                        border: `1px solid ${draftSettings.lightingPreset === key ? 'var(--primary)' : 'var(--border-subtle)'}`,
                        background: draftSettings.lightingPreset === key ? 'rgba(185,28,28,0.08)' : 'transparent',
                        color: draftSettings.lightingPreset === key ? 'var(--primary)' : 'var(--text-secondary)',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}>
                        <Icon size={11} /> {label}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Background</span>
                    <input
                      type="color"
                      value={draftSettings.backgroundColor}
                      onChange={e => setDraftSettings(s => ({ ...s, backgroundColor: e.target.value }))}
                      style={{ width: 32, height: 24, border: 'none', borderRadius: 4, cursor: 'pointer', background: 'none' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{draftSettings.backgroundColor}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem' }}>
                    <button onClick={() => setEditingSettings(false)} className="btn-ghost" style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }}>
                      <Undo2 size={12} /> Cancel
                    </button>
                    <button onClick={saveSettings} disabled={saving} className="btn-primary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }}>
                      <Save size={12} /> {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Graph context */}
          <AnimatePresence>
            {(nestedModels.length > 0 || backlinks.length > 0) && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="card-modern"
                style={{ padding: '18px' }}
              >
                <h4 style={{ color: 'var(--success)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'var(--font-mono)' }}>
                  <Layers size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                  Graph Context
                </h4>
                {nestedModels.length > 0 && (
                  <div style={{ marginBottom: backlinks.length ? '0.9rem' : 0 }}>
                    <h5 style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-mono)' }}>Links Out</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {nestedModels.map(nested => (
                        <Link key={nested.id} to={`/model/${nested.id}`} className="btn-ghost" style={{ justifyContent: 'flex-start', padding: '0.4rem 0.6rem', fontSize: '0.78rem' }}>
                          <Box size={12} />
                          {nested.title}
                          <ChevronRight size={10} style={{ marginLeft: 'auto', opacity: 0.4 }} />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {backlinks.length > 0 && (
                  <div>
                    <h5 style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-mono)' }}>Linked From</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {backlinks.map(link => (
                        <Link key={`${link.id}-${link.poiId}`} to={`/model/${link.id}`} className="btn-ghost" style={{ justifyContent: 'flex-start', padding: '0.4rem 0.6rem', fontSize: '0.78rem' }}>
                          <Link2 size={12} />
                          {link.title}
                          <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontSize: '0.7rem' }}>via {link.poiTitle}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* POI quick nav */}
          <AnimatePresence>
            {pois.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="card-modern"
                style={{ padding: '18px' }}
              >
                <h4 style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'var(--font-mono)' }}>
                  <MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                  Jump to POI
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {pois.map((poi, idx) => (
                    <button
                      key={poi.id}
                      onClick={() => document.getElementById(`poi-${poi.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      style={{
                        textAlign: 'left', background: 'none', border: 'none',
                        padding: '5px 8px', color: 'var(--text-secondary)', cursor: 'pointer',
                        fontSize: '0.82rem', borderRadius: 'var(--radius-sm)',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        fontFamily: 'var(--font-body)',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                    >
                      <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.7rem', minWidth: '18px', fontFamily: 'var(--font-mono)' }}>{idx + 1}.</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{poi.title}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default ModelWiki

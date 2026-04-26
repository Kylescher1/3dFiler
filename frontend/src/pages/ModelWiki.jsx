import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import MarkdownContent from '../components/MarkdownContent'

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
function PoiReferenceHelper({ pois, onInsert, visible, query, caretPos, textareaRef }) {
  if (!visible || !query) return null
  const matches = pois.filter(p => p.title.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
  if (matches.length === 0) return null

  return (
    <div style={{
      position: 'absolute',
      zIndex: 100,
      background: '#1a1a24',
      border: '1px solid #2a2a2a',
      borderRadius: '8px',
      padding: '4px 0',
      minWidth: '200px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    }}>
      {matches.map(poi => (
        <button
          key={poi.id}
          onClick={() => onInsert(poi.id)}
          style={{
            display: 'block', width: '100%', textAlign: 'left',
            background: 'none', border: 'none', padding: '6px 12px',
            color: '#ccc', cursor: 'pointer', fontSize: '0.85rem',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#252530'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ color: '#4fc3f7', fontWeight: 600 }}>{poi.title}</span>
          <span style={{ color: '#555', fontSize: '0.75rem', marginLeft: '0.5rem' }}>[[poi:{poi.id}]]</span>
        </button>
      ))}
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
  const [draftWiki, setDraftWiki] = useState('')
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
        // Determine ownership
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#ef5350' }}>
      {error}
    </div>
  )

  if (!model) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#888' }}>
      Loading wiki...
    </div>
  )

  const extension = model.originalName?.split('.').pop()?.toUpperCase()
  const processedWiki = preprocessWikiWiki(model.wikiContent, pois)

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e0e0e0' }}>
      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,14,0.95)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #1a1a1a',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/dashboard" style={{ color: '#4fc3f7', fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}>3dFiler</Link>
            <span style={{ color: '#333' }}>/</span>
            <span style={{ color: '#888', fontSize: '0.85rem', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{model.title}</span>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '2px', background: '#111', borderRadius: '8px', padding: '3px' }}>
            <button
              onClick={() => navigate(`/model/${id}`)}
              style={{
                padding: '6px 14px', borderRadius: '6px', border: 'none',
                background: 'transparent', color: '#888', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: 500,
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#ccc'}
              onMouseLeave={e => e.currentTarget.style.color = '#888'}
            >
              3D Viewer
            </button>
            <button
              style={{
                padding: '6px 14px', borderRadius: '6px', border: 'none',
                background: '#1e3a4c', color: '#4fc3f7', cursor: 'default',
                fontSize: '0.85rem', fontWeight: 600,
              }}
            >
              Wiki
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 20px 60px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: '28px' }}>
        {/* Left: Wiki content */}
        <div>
          {/* Title + actions */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#e0e0e0' }}>{model.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: '#666', background: '#111', padding: '2px 8px', borderRadius: '10px', border: '1px solid #1a1a1a' }}>{extension}</span>
                {model.published ? (
                  <span style={{ fontSize: '0.75rem', color: '#81c784', background: '#0f2a15', padding: '2px 8px', borderRadius: '10px', border: '1px solid #1e4a2a' }}>Published</span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#ffab91', background: '#2a1810', padding: '2px 8px', borderRadius: '10px', border: '1px solid #4a3020' }}>Private</span>
                )}
                {(model.tags || []).map(t => (
                  <span key={t.id} style={{ fontSize: '0.75rem', color: '#4fc3f7', background: '#0f1f2a', padding: '2px 8px', borderRadius: '10px', border: '1px solid #1e3a4c' }}>{t.name}</span>
                ))}
              </div>
            </div>
            {isOwner && !editing && (
              <button
                onClick={() => setEditing(true)}
                style={{
                  padding: '6px 14px', borderRadius: '6px', border: '1px solid #2a2a2a',
                  background: '#141419', color: '#ccc', cursor: 'pointer',
                  fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit Wiki
              </button>
            )}
          </div>

          {/* Wiki body */}
          {editing ? (
            <div style={{ position: 'relative' }}>
              <textarea
                ref={textareaRef}
                value={draftWiki}
                onChange={handleTextareaChange}
                rows={20}
                style={{
                  width: '100%', padding: '16px', background: '#111', color: '#e0e0e0',
                  border: '1px solid #2a2a2a', borderRadius: '10px', fontSize: '0.9rem',
                  lineHeight: 1.6, fontFamily: 'monospace', resize: 'vertical',
                }}
                placeholder="# Welcome to the Wiki&#10;&#10;Write markdown here. Reference POIs with [[poi:poi-id]]."
              />
              <PoiReferenceHelper
                pois={pois}
                onInsert={insertPoiRef}
                visible={suggestVisible}
                query={suggestQuery}
                textareaRef={textareaRef}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setEditing(false); setDraftWiki(model.wikiContent || ''); setSuggestVisible(false) }}
                  style={{
                    padding: '8px 16px', borderRadius: '6px', border: '1px solid #2a2a2a',
                    background: '#141419', color: '#ccc', cursor: 'pointer', fontSize: '0.85rem',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveWiki}
                  disabled={saving}
                  style={{
                    padding: '8px 16px', borderRadius: '6px', border: 'none',
                    background: '#1e3a4c', color: '#4fc3f7', cursor: saving ? 'wait' : 'pointer',
                    fontSize: '0.85rem', fontWeight: 600,
                  }}
                >
                  {saving ? 'Saving...' : 'Save Wiki'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ background: '#0f0f12', borderRadius: '10px', padding: '24px', border: '1px solid #1a1a1a' }}>
              {processedWiki.trim() ? (
                <MarkdownContent content={processedWiki} />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <p style={{ color: '#555', fontSize: '0.95rem', marginBottom: '12px' }}>No wiki content yet.</p>
                  {isOwner && (
                    <button
                      onClick={() => setEditing(true)}
                      style={{
                        padding: '8px 18px', borderRadius: '6px', border: '1px solid #2a2a2a',
                        background: '#141419', color: '#4fc3f7', cursor: 'pointer',
                        fontSize: '0.85rem', fontWeight: 600,
                      }}
                    >
                      + Write the First Wiki Page
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Auto POI sections */}
          {pois.length > 0 && (
            <div style={{ marginTop: '32px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#4fc3f7', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Points of Interest
                <span style={{ fontSize: '0.75rem', color: '#555', fontWeight: 400 }}>({pois.length})</span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pois.map((poi, idx) => (
                  <div
                    key={poi.id}
                    id={`poi-${poi.id}`}
                    style={{
                      background: '#0f0f12', borderRadius: '10px', padding: '18px',
                      border: '1px solid #1a1a1a',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <span style={{
                        background: '#4fc3f7', color: '#0a0a0a', width: '24px', height: '24px',
                        borderRadius: '50%', fontSize: '12px', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>{idx + 1}</span>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#e0e0e0' }}>{poi.title}</h3>
                      <span style={{ fontSize: '0.7rem', color: '#555', border: '1px solid #2a2a2a', padding: '1px 8px', borderRadius: '10px', textTransform: 'capitalize' }}>{poi.type}</span>
                    </div>
                    {poi.type === 'nested-model' && poi.content ? (
                      <div>
                        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '10px' }}>This POI links to another model.</p>
                        <button
                          onClick={() => navigate(`/model/${poi.content}`)}
                          style={{
                            padding: '6px 14px', borderRadius: '6px', border: '1px solid #2a2a2a',
                            background: '#141419', color: '#4fc3f7', cursor: 'pointer',
                            fontSize: '0.85rem',
                          }}
                        >
                          Open Nested Model
                        </button>
                      </div>
                    ) : (
                      <MarkdownContent content={poi.content} style={{ fontSize: '0.85rem' }} />
                    )}
                    <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => navigate(`/model/${id}?poi=${poi.id}`)}
                        style={{
                          padding: '4px 10px', borderRadius: '6px', border: '1px solid #2a2a2a',
                          background: '#111', color: '#888', cursor: 'pointer',
                          fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px',
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        View in 3D
                      </button>
                      {isOwner && editing && (
                        <span style={{ fontSize: '0.75rem', color: '#555', display: 'flex', alignItems: 'center' }}>
                          Ref: <code style={{ background: '#1a1a1a', padding: '1px 4px', borderRadius: '3px', marginLeft: '4px' }}>[[poi:{poi.id}]]</code>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Model meta card */}
          <div style={{ background: '#0f0f12', borderRadius: '10px', padding: '16px', border: '1px solid #1a1a1a' }}>
            <h4 style={{ color: '#4fc3f7', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Model Info</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Format</span>
                <span style={{ color: '#ccc', fontWeight: 500 }}>{extension || 'Unknown'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>POIs</span>
                <span style={{ color: '#ccc', fontWeight: 500 }}>{pois.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Status</span>
                <span style={{ color: model.published ? '#81c784' : '#ffab91', fontWeight: 500 }}>{model.published ? 'Published' : 'Private'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Uploaded</span>
                <span style={{ color: '#ccc', fontWeight: 500 }}>{new Date(model.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div style={{ background: '#0f0f12', borderRadius: '10px', padding: '16px', border: '1px solid #1a1a1a' }}>
            <h4 style={{ color: '#4fc3f7', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link to={`/model/${id}`} style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.85rem', padding: '6px 10px', borderRadius: '6px', background: '#111', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                Open 3D Viewer
              </Link>
              {model.published && (
                <Link to={`/model/${id}`} style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.85rem', padding: '6px 10px', borderRadius: '6px', background: '#111', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                  Share Link
                </Link>
              )}
            </div>
          </div>

          {/* POI quick nav */}
          {pois.length > 0 && (
            <div style={{ background: '#0f0f12', borderRadius: '10px', padding: '16px', border: '1px solid #1a1a1a' }}>
              <h4 style={{ color: '#4fc3f7', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Jump to POI</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {pois.map((poi, idx) => (
                  <button
                    key={poi.id}
                    onClick={() => document.getElementById(`poi-${poi.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    style={{
                      textAlign: 'left', background: 'none', border: 'none',
                      padding: '4px 8px', color: '#aaa', cursor: 'pointer',
                      fontSize: '0.8rem', borderRadius: '4px',
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#ccc' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#aaa' }}
                  >
                    <span style={{ color: '#4fc3f7', fontWeight: 700, fontSize: '0.7rem', minWidth: '16px' }}>{idx + 1}.</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{poi.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ModelWiki

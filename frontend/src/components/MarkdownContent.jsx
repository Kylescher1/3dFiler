import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const markdownStyles = {
  color: '#bbb',
  lineHeight: 1.6,
  fontSize: '0.9rem',
}

const components = {
  h1: ({ children }) => <h1 style={{ color: '#e0e0e0', fontSize: '1.3rem', fontWeight: 600, margin: '1rem 0 0.5rem', borderBottom: '1px solid #2a2a2a', paddingBottom: '0.3rem' }}>{children}</h1>,
  h2: ({ children }) => <h2 style={{ color: '#e0e0e0', fontSize: '1.1rem', fontWeight: 600, margin: '0.9rem 0 0.4rem', borderBottom: '1px solid #2a2a2a', paddingBottom: '0.25rem' }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ color: '#ccc', fontSize: '1rem', fontWeight: 600, margin: '0.7rem 0 0.3rem' }}>{children}</h3>,
  p: ({ children }) => <p style={{ margin: '0.4rem 0' }}>{children}</p>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#4fc3f7', textDecoration: 'none' }}>{children}</a>,
  ul: ({ children }) => <ul style={{ margin: '0.4rem 0', paddingLeft: '1.2rem' }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ margin: '0.4rem 0', paddingLeft: '1.2rem' }}>{children}</ol>,
  li: ({ children }) => <li style={{ margin: '0.15rem 0' }}>{children}</li>,
  code: ({ children }) => <code style={{ background: '#1a1a1a', padding: '1px 4px', borderRadius: '3px', fontSize: '0.85em', color: '#81c784', fontFamily: 'monospace' }}>{children}</code>,
  pre: ({ children }) => <pre style={{ background: '#111', padding: '0.75rem', borderRadius: '6px', overflowX: 'auto', border: '1px solid #2a2a2a', fontSize: '0.85rem' }}>{children}</pre>,
  blockquote: ({ children }) => <blockquote style={{ borderLeft: '3px solid #4fc3f7', margin: '0.5rem 0', paddingLeft: '0.75rem', color: '#999' }}>{children}</blockquote>,
  hr: () => <hr style={{ border: 'none', borderTop: '1px solid #2a2a2a', margin: '0.75rem 0' }} />,
  strong: ({ children }) => <strong style={{ color: '#e0e0e0', fontWeight: 600 }}>{children}</strong>,
  em: ({ children }) => <em style={{ color: '#ccc' }}>{children}</em>,
  table: ({ children }) => <table style={{ borderCollapse: 'collapse', width: '100%', margin: '0.5rem 0', fontSize: '0.85rem' }}>{children}</table>,
  thead: ({ children }) => <thead style={{ background: '#1a1a1a' }}>{children}</thead>,
  th: ({ children }) => <th style={{ border: '1px solid #2a2a2a', padding: '0.4rem 0.6rem', textAlign: 'left', color: '#ccc', fontWeight: 600 }}>{children}</th>,
  td: ({ children }) => <td style={{ border: '1px solid #2a2a2a', padding: '0.4rem 0.6rem', color: '#bbb' }}>{children}</td>,
}

function MarkdownContent({ content, style = {} }) {
  if (!content || !content.trim()) return <em style={{ color: '#555' }}>No content.</em>
  return (
    <div style={{ ...markdownStyles, ...style }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownContent

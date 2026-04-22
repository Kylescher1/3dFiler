import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info') => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            style={{
              pointerEvents: 'auto',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 500,
              color: '#fff',
              background:
                toast.type === 'success'
                  ? '#2e7d32'
                  : toast.type === 'error'
                    ? '#c62828'
                    : '#1565c0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              animation: 'toastIn 0.3s ease',
              maxWidth: '320px',
              wordBreak: 'break-word',
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

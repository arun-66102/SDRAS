import { useFlash } from '../context/FlashContext'

const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' }

export default function FlashMessages() {
  const { messages } = useFlash()

  if (messages.length === 0) return null

  return (
    <div className="flash-messages">
      {messages.map(m => (
        <div key={m.id} className={`flash-message ${m.type}`}>
          {icons[m.type] || 'ℹ'} {m.message}
        </div>
      ))}
    </div>
  )
}

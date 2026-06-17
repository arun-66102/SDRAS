import { createContext, useContext, useState, useCallback } from 'react'

const FlashContext = createContext(null)

let flashIdCounter = 0

export function FlashProvider({ children }) {
  const [messages, setMessages] = useState([])

  const showFlash = useCallback((message, type = 'info') => {
    const id = ++flashIdCounter
    setMessages(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== id))
    }, 5000)
  }, [])

  const removeFlash = useCallback((id) => {
    setMessages(prev => prev.filter(m => m.id !== id))
  }, [])

  return (
    <FlashContext.Provider value={{ messages, showFlash, removeFlash }}>
      {children}
    </FlashContext.Provider>
  )
}

export function useFlash() {
  const context = useContext(FlashContext)
  if (!context) throw new Error('useFlash must be used within FlashProvider')
  return context
}

export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="text-center" style={{ padding: '3rem' }}>
      <div className="spinner"></div>
      <p className="text-muted mt-2">{text}</p>
    </div>
  )
}

import { useState } from 'react'

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null

  return (
    <div className={`modal-backdrop ${isOpen ? 'open' : ''}`} onClick={onCancel}>
      <div className="modal-content glass" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title || 'Confirm Action'}</h3>
          <button className="modal-close" onClick={onCancel}>&times;</button>
        </div>
        <div className="modal-body">
          <p>{message || 'Are you sure you want to proceed?'}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
          <button className="btn btn-success" onClick={onConfirm}>Yes, Confirm</button>
        </div>
      </div>
    </div>
  )
}

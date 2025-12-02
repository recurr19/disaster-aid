import React from 'react';

const ConfirmModal = ({ open, title = 'Confirm', message = '', onConfirm, onCancel, confirmLabel = 'OK', cancelLabel = 'Cancel' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 99999, background: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-lg p-5 w-full max-w-md" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="text-sm text-gray-700 mb-4">{message}</div>
        <div className="flex justify-end gap-2">
          <button className="button-secondary" onClick={onCancel}>{cancelLabel}</button>
          <button className="button-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

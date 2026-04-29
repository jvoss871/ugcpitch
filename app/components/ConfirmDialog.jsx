'use client';

export function ConfirmDialog({ open, message, onConfirm, onCancel, confirmLabel = 'Delete' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-gray-900 font-semibold text-sm leading-relaxed mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

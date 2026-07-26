import { useState } from 'react';
import { FiTrash2, FiX, FiAlertTriangle } from 'react-icons/fi';

/**
 * Floating action bar and modal confirmation for bulk deletion.
 */
const BulkDeleteActionBar = ({
  selectedCount = 0,
  onClearSelection,
  onConfirmDelete,
  itemLabel = 'record',
  isDeleting = false,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  if (selectedCount === 0) return null;

  const handleConfirm = async () => {
    await onConfirmDelete();
    setShowConfirmModal(false);
  };

  return (
    <>
      {/* Floating/Sticky Action Bar at bottom of screen */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 rounded-2xl border border-rose-500/40 bg-slate-950/90 px-5 py-3 shadow-[0_10px_40px_rgba(225,29,72,0.35)] backdrop-blur-xl animate-slide-up">
        <div className="flex items-center gap-2">
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500/20 text-xs font-black text-rose-300">
            {selectedCount}
          </span>
          <span className="text-xs font-bold text-white">
            {selectedCount} {itemLabel}{selectedCount > 1 ? 's' : ''} selected
          </span>
        </div>

        <div className="h-4 w-px bg-white/10" />

        <button
          onClick={onClearSelection}
          className="btn-ghost py-1 px-2.5 text-xs text-slate-400 hover:text-white"
        >
          Cancel
        </button>

        <button
          onClick={() => setShowConfirmModal(true)}
          className="btn-danger py-1.5 px-4 text-xs font-bold gap-1.5 shadow-lg"
        >
          <FiTrash2 size={13} />
          Delete Selected
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="glass-card max-w-md w-full border-rose-500/30 p-6 space-y-5 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <FiAlertTriangle size={20} />
                <h3 className="font-display text-lg font-bold text-white">Confirm Bulk Deletion</h3>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p className="font-semibold text-white">
                Delete {selectedCount} payment {itemLabel}{selectedCount > 1 ? 's' : ''}?
              </p>
              <p className="text-rose-300/80">
                This action is permanent and cannot be undone. Selected payment records will be deleted from the database.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isDeleting}
                className="btn-secondary py-2 px-4 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isDeleting}
                className="btn-danger py-2 px-5 text-xs font-bold gap-1.5"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <FiTrash2 size={13} /> Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkDeleteActionBar;

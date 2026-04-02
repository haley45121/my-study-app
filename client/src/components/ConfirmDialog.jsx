import Modal from './Modal';

export default function ConfirmDialog({ title, message, onConfirm, onCancel, confirmText = 'Delete', danger = true }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="confirm-dialog">
        <p className="confirm-message">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

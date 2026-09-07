export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  danger,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="w-full max-w-sm rounded-lg bg-paper-raised p-6 shadow-lg">
        <h2 id="confirm-title" className="font-serif text-lg text-ink">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-sm text-ink-soft">{description}</p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm text-ink-soft hover:bg-paper"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-md px-4 py-2 text-sm text-white ${danger ? "bg-danger hover:bg-danger/90" : "bg-moss hover:bg-moss-dark"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

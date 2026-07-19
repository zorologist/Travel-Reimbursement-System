interface FinalizeDialogProps {
  open: boolean;
  requestId: string;
  employeeName: string;
  officialTotal: number;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const money = new Intl.NumberFormat("en-EG", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function FinalizeDialog({
  open,
  requestId,
  employeeName,
  officialTotal,
  busy = false,
  onCancel,
  onConfirm,
}: FinalizeDialogProps) {
  if (!open) return null;

  return (
    <div className="salary-dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        className="salary-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="salary-finalize-title"
        aria-describedby="salary-finalize-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="salary-dialog-lock" aria-hidden="true">
          !
        </span>
        <h2 id="salary-finalize-title">Finalize payment?</h2>
        <p id="salary-finalize-description">
          This permanently completes <strong>{requestId}</strong> for {employeeName}.
          The action cannot be reversed from this screen.
        </p>
        <div className="salary-dialog-total">
          <span>Official total</span>
          <strong>{money.format(officialTotal)} EGP</strong>
        </div>
        <div className="salary-dialog-actions">
          <button type="button" className="salary-btn salary-btn--secondary" disabled={busy} onClick={onCancel}>
            Go back
          </button>
          <button type="button" className="salary-btn salary-btn--danger" disabled={busy} onClick={onConfirm} autoFocus>
            {busy ? "Finalizing..." : "Confirm finalization"}
          </button>
        </div>
      </section>
    </div>
  );
}

interface FinalizeDialogProps {
  open: boolean;
  requestId: string;
  employeeName: string;
  officialTotal: number;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}
import { useLanguage } from "../../hooks/useLanguage";
import { formatCurrency } from "../../i18n/format";

export function FinalizeDialog({
  open,
  requestId,
  employeeName,
  officialTotal,
  busy = false,
  onCancel,
  onConfirm,
}: FinalizeDialogProps) {
  const { language, tr } = useLanguage();
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
        <h2 id="salary-finalize-title">{tr("Finalize payment?", "هل تريد اعتماد الدفع؟")}</h2>
        <p id="salary-finalize-description">
          {tr(`This permanently completes ${requestId} for ${employeeName}. The action cannot be reversed from this screen.`, `سيؤدي هذا إلى إكمال الطلب ${requestId} نهائياً للموظف ${employeeName}. لا يمكن التراجع عن الإجراء من هذه الشاشة.`)}
        </p>
        <div className="salary-dialog-total">
          <span>{tr("Official total", "الإجمالي الرسمي")}</span>
          <strong>{formatCurrency(officialTotal, language)}</strong>
        </div>
        <div className="salary-dialog-actions">
          <button type="button" className="salary-btn salary-btn--secondary" disabled={busy} onClick={onCancel}>
            {tr("Go back", "رجوع")}
          </button>
          <button type="button" className="salary-btn salary-btn--danger" disabled={busy} onClick={onConfirm} autoFocus>
            {busy ? tr("Finalizing...", "جارٍ الاعتماد...") : tr("Confirm finalization", "تأكيد الاعتماد")}
          </button>
        </div>
      </section>
    </div>
  );
}

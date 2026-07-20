import { useState } from "react";

import type {
  SalaryAdjustmentInput,
  SalaryQueueItem,
} from "../../services/salaryApi";
import { FinalizeDialog } from "./FinalizeDialog";
import { SalaryAdjustmentForm } from "./SalaryAdjustmentForm";
import { useLanguage } from "../../hooks/useLanguage";
import { formatCurrency, formatDate, formatDateTime, localizeLabel } from "../../i18n/format";

interface SalaryReviewPanelProps {
  request: SalaryQueueItem;
  onSave: (input: SalaryAdjustmentInput) => Promise<void>;
  onFinalize: (note: string) => Promise<void>;
}

export function SalaryReviewPanel({
  request,
  onSave,
  onFinalize,
}: SalaryReviewPanelProps) {
  const { language, localizeError, tr } = useLanguage();
  const [bonusAmount, setBonusAmount] = useState(request.calculation.bonusAmount);
  const [penaltyAmount, setPenaltyAmount] = useState(request.calculation.penaltyAmount);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState("");

  const dirty =
    bonusAmount !== request.calculation.bonusAmount ||
    penaltyAmount !== request.calculation.penaltyAmount;
  const previewTotal =
    request.calculation.totalAmount -
    request.calculation.bonusAmount +
    request.calculation.penaltyAmount +
    bonusAmount -
    penaltyAmount;

  async function saveAdjustments() {
    setError("");
    setSaving(true);
    try {
      await onSave({ bonusAmount, penaltyAmount, note: note.trim() });
    } catch (saveError) {
      setError(localizeError(saveError, "The salary adjustment could not be saved.", "تعذر حفظ تعديل الرواتب."));
    } finally {
      setSaving(false);
    }
  }

  function requestFinalization() {
    setError("");
    if (dirty) {
      setError(tr("Save the adjustment preview before finalizing this request.", "احفظ معاينة التعديل قبل اعتماد هذا الطلب نهائياً."));
      return;
    }
    if (!note.trim()) {
      setError(tr("Add the required audit note before finalizing this request.", "أضف ملاحظة التدقيق المطلوبة قبل اعتماد هذا الطلب نهائياً."));
      return;
    }
    setDialogOpen(true);
  }

  async function confirmFinalization() {
    setError("");
    setFinalizing(true);
    try {
      await onFinalize(note.trim());
      setDialogOpen(false);
    } catch (finalizeError) {
      setError(localizeError(finalizeError, "The salary action could not be completed.", "تعذر إكمال إجراء الرواتب."));
      setDialogOpen(false);
    } finally {
      setFinalizing(false);
    }
  }

  const calculation = request.calculation;

  return (
    <aside className="salary-review" aria-label={tr(`Salary review for ${request.id}`, `مراجعة الرواتب للطلب ${request.id}`)}>
      <header className="salary-review-header">
        <div>
          <span>{tr("Calculation verification", "التحقق من الحساب")}</span>
          <h2>{tr("Payment finalization", "اعتماد الدفع")}</h2>
        </div>
        <strong>{request.id}</strong>
      </header>

      <section className="salary-panel-section">
        <h3>
          {tr("Verified system inputs", "مدخلات النظام المؤكدة")} <span className="salary-lock-badge">{tr("System locked", "مقفلة بواسطة النظام")}</span>
        </h3>
        <dl className="salary-info-list">
          <div><dt>{tr("Employee ID", "رقم الموظف")}</dt><dd>{request.employee.employeeNumber}</dd></div>
          <div><dt>{tr("Full name", "الاسم الكامل")}</dt><dd>{request.employee.displayName}</dd></div>
          <div><dt>{tr("Department", "القسم")}</dt><dd>{request.employee.department}</dd></div>
          <div><dt>{tr("Job grade", "الدرجة الوظيفية")}</dt><dd>{localizeLabel(request.employee.jobLevel, language)}</dd></div>
          <div><dt>{tr("Destination", "الوجهة")}</dt><dd>{localizeLabel(request.destinationCity, language)}</dd></div>
          <div><dt>{tr("Travel dates", "تواريخ السفر")}</dt><dd>{formatDate(request.departureAt, language)} – {formatDate(request.returnAt, language)}</dd></div>
          <div><dt>{tr("Accommodation", "الإقامة")}</dt><dd>{localizeLabel(request.accommodationType, language)}</dd></div>
          <div><dt>{tr("Transportation", "الانتقالات")}</dt><dd>{localizeLabel(request.transportationMethod, language)}</dd></div>
          <div><dt>{tr("Overnight count", "عدد ليالي المبيت")}</dt><dd>{calculation.overnightCount}</dd></div>
          <div><dt>{tr("Verified return hours", "ساعات العودة المؤكدة")}</dt><dd>{request.verifiedReturnDayHours}</dd></div>
        </dl>
      </section>

      <section className="salary-panel-section">
        <h3>
          {tr("Calculation breakdown", "تفاصيل الحساب")} <span className="salary-auto-badge">{tr("Shared auto-calc", "حساب تلقائي مشترك")}</span>
        </h3>
        <dl className="salary-info-list salary-breakdown">
          <div><dt>{tr("Daily base rate", "المعدل اليومي الأساسي")}</dt><dd>{formatCurrency(calculation.dailyRate, language)}</dd></div>
          <div><dt>{tr("Overnight allowance", "بدل المبيت")} × {calculation.overnightCount}</dt><dd>{formatCurrency(calculation.overnightAmount, language)}</dd></div>
          <div><dt>{tr("Same-day allowance", "بدل اليوم الواحد")}</dt><dd>{formatCurrency(calculation.sameDayAmount, language)}</dd></div>
          <div><dt>{tr("Return-day allowance", "بدل يوم العودة")}</dt><dd>{formatCurrency(calculation.returnDayAmount, language)}</dd></div>
          <div><dt>{tr("Transportation cost", "تكلفة الانتقال")}</dt><dd>{formatCurrency(calculation.transportationCost, language)}</dd></div>
          <div><dt>{tr("Saved bonus", "المكافأة المحفوظة")}</dt><dd>+ {formatCurrency(calculation.bonusAmount, language)}</dd></div>
          <div><dt>{tr("Saved penalty", "الخصم المحفوظ")}</dt><dd>− {formatCurrency(calculation.penaltyAmount, language)}</dd></div>
          <div className="salary-breakdown-total"><dt>{tr("Official saved total", "الإجمالي الرسمي المحفوظ")}</dt><dd>{formatCurrency(calculation.totalAmount, language)}</dd></div>
        </dl>
      </section>

      {request.revisions.length > 0 && (
        <section className="salary-panel-section">
          <h3>{tr("Price revision history", "سجل تعديلات المبلغ")}</h3>
          <ol className="salary-history">
            {request.revisions.map((revision) => (
              <li key={revision.id}>
                <div>
                  <strong>{localizeLabel(revision.department, language)}</strong>
                  <time dateTime={revision.updatedAt}>{formatDateTime(revision.updatedAt, language)}</time>
                </div>
                <p>{revision.reason}</p>
                <span>{formatCurrency(revision.previousPrice, language)} → {formatCurrency(revision.newPrice, language)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <SalaryAdjustmentForm
        bonusAmount={bonusAmount}
        penaltyAmount={penaltyAmount}
        note={note}
        disabled={saving || finalizing}
        onBonusChange={setBonusAmount}
        onPenaltyChange={setPenaltyAmount}
        onNoteChange={setNote}
      />

      <footer className="salary-review-footer">
        {error && <p className="salary-action-error" role="alert">{error}</p>}
        {dirty && (
          <div className="salary-preview-total">
            <span>{tr("Unsaved adjusted preview", "معاينة التعديل غير المحفوظ")}</span>
            <strong>{formatCurrency(previewTotal, language)}</strong>
          </div>
        )}
        <div className="salary-official-total">
          <span><strong>{tr("Official total", "الإجمالي الرسمي")}</strong><small>{tr("Last saved calculation", "آخر حساب محفوظ")}</small></span>
          <strong>{formatCurrency(calculation.totalAmount, language)}</strong>
        </div>
        <button
          className="salary-btn salary-btn--secondary salary-btn--wide"
          type="button"
          disabled={!dirty || saving || finalizing}
          onClick={saveAdjustments}
        >
          {saving ? tr("Saving adjustments...", "جارٍ حفظ التعديلات...") : tr("Save adjustments", "حفظ التعديلات")}
        </button>
        <button
          className="salary-btn salary-btn--primary salary-btn--wide"
          type="button"
          disabled={saving || finalizing}
          onClick={requestFinalization}
        >
          {tr("Finalize payment (irreversible)", "اعتماد الدفع (لا يمكن التراجع)")}
        </button>
        <small className="salary-compliance">{tr("All salary actions are recorded in the request audit trail.", "يتم تسجيل جميع إجراءات الرواتب في سجل الطلب.")}</small>
      </footer>

      <FinalizeDialog
        open={dialogOpen}
        requestId={request.id}
        employeeName={request.employee.displayName}
        officialTotal={calculation.totalAmount}
        busy={finalizing}
        onCancel={() => !finalizing && setDialogOpen(false)}
        onConfirm={confirmFinalization}
      />
    </aside>
  );
}

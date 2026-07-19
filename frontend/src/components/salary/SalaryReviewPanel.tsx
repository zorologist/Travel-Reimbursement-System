import { useState } from "react";

import type {
  SalaryAdjustmentInput,
  SalaryQueueItem,
} from "../../services/salaryApi";
import { FinalizeDialog } from "./FinalizeDialog";
import { SalaryAdjustmentForm } from "./SalaryAdjustmentForm";
import {
  formatSalaryDateRange,
  salaryDateTime,
  salaryMoney,
} from "./salaryFormat";

interface SalaryReviewPanelProps {
  request: SalaryQueueItem;
  onSave: (input: SalaryAdjustmentInput) => Promise<void>;
  onFinalize: (note: string) => Promise<void>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "The salary action could not be completed.";
}

export function SalaryReviewPanel({
  request,
  onSave,
  onFinalize,
}: SalaryReviewPanelProps) {
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
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  function requestFinalization() {
    setError("");
    if (dirty) {
      setError("Save the adjustment preview before finalizing this request.");
      return;
    }
    if (!note.trim()) {
      setError("Add the required audit note before finalizing this request.");
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
      setError(errorMessage(finalizeError));
      setDialogOpen(false);
    } finally {
      setFinalizing(false);
    }
  }

  const calculation = request.calculation;

  return (
    <aside className="salary-review" aria-label={`Salary review for ${request.id}`}>
      <header className="salary-review-header">
        <div>
          <span>Calculation verification</span>
          <h2>Payment finalization</h2>
        </div>
        <strong>{request.id}</strong>
      </header>

      <section className="salary-panel-section">
        <h3>
          Verified system inputs <span className="salary-lock-badge">System locked</span>
        </h3>
        <dl className="salary-info-list">
          <div><dt>Employee ID</dt><dd>{request.employee.employeeNumber}</dd></div>
          <div><dt>Full name</dt><dd>{request.employee.displayName}</dd></div>
          <div><dt>Department</dt><dd>{request.employee.department}</dd></div>
          <div><dt>Job grade</dt><dd>{request.employee.jobLevel}</dd></div>
          <div><dt>Destination</dt><dd>{request.destinationCity}</dd></div>
          <div><dt>Travel dates</dt><dd>{formatSalaryDateRange(request.departureAt, request.returnAt)}</dd></div>
          <div><dt>Accommodation</dt><dd>{request.accommodationType.replaceAll("-", " ")}</dd></div>
          <div><dt>Transportation</dt><dd>{request.transportationMethod}</dd></div>
          <div><dt>Overnight count</dt><dd>{calculation.overnightCount}</dd></div>
          <div><dt>Verified return hours</dt><dd>{request.verifiedReturnDayHours}</dd></div>
        </dl>
      </section>

      <section className="salary-panel-section">
        <h3>
          Calculation breakdown <span className="salary-auto-badge">Shared auto-calc</span>
        </h3>
        <dl className="salary-info-list salary-breakdown">
          <div><dt>Daily base rate</dt><dd>{salaryMoney.format(calculation.dailyRate)} EGP</dd></div>
          <div><dt>Overnight allowance × {calculation.overnightCount}</dt><dd>{salaryMoney.format(calculation.overnightAmount)} EGP</dd></div>
          <div><dt>Same-day allowance</dt><dd>{salaryMoney.format(calculation.sameDayAmount)} EGP</dd></div>
          <div><dt>Return-day allowance</dt><dd>{salaryMoney.format(calculation.returnDayAmount)} EGP</dd></div>
          <div><dt>Transportation cost</dt><dd>{salaryMoney.format(calculation.transportationCost)} EGP</dd></div>
          <div><dt>Saved bonus</dt><dd>+ {salaryMoney.format(calculation.bonusAmount)} EGP</dd></div>
          <div><dt>Saved penalty</dt><dd>− {salaryMoney.format(calculation.penaltyAmount)} EGP</dd></div>
          <div className="salary-breakdown-total"><dt>Official saved total</dt><dd>{salaryMoney.format(calculation.totalAmount)} EGP</dd></div>
        </dl>
      </section>

      {request.revisions.length > 0 && (
        <section className="salary-panel-section">
          <h3>Price revision history</h3>
          <ol className="salary-history">
            {request.revisions.map((revision) => (
              <li key={revision.id}>
                <div>
                  <strong>{revision.department}</strong>
                  <time dateTime={revision.updatedAt}>{salaryDateTime.format(new Date(revision.updatedAt))}</time>
                </div>
                <p>{revision.reason}</p>
                <span>{salaryMoney.format(revision.previousPrice)} → {salaryMoney.format(revision.newPrice)} EGP</span>
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
            <span>Unsaved adjusted preview</span>
            <strong>{salaryMoney.format(previewTotal)} EGP</strong>
          </div>
        )}
        <div className="salary-official-total">
          <span><strong>Official total</strong><small>Last saved calculation</small></span>
          <strong>{salaryMoney.format(calculation.totalAmount)} <small>EGP</small></strong>
        </div>
        <button
          className="salary-btn salary-btn--secondary salary-btn--wide"
          type="button"
          disabled={!dirty || saving || finalizing}
          onClick={saveAdjustments}
        >
          {saving ? "Saving adjustments..." : "Save adjustments"}
        </button>
        <button
          className="salary-btn salary-btn--primary salary-btn--wide"
          type="button"
          disabled={saving || finalizing}
          onClick={requestFinalization}
        >
          Finalize payment (irreversible)
        </button>
        <small className="salary-compliance">All salary actions are recorded in the request audit trail.</small>
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

import type { ChangeEvent } from "react";

interface SalaryAdjustmentFormProps {
  bonusAmount: number;
  penaltyAmount: number;
  note: string;
  disabled?: boolean;
  onBonusChange: (value: number) => void;
  onPenaltyChange: (value: number) => void;
  onNoteChange: (value: string) => void;
}

function moneyValue(event: ChangeEvent<HTMLInputElement>): number {
  if (event.target.value === "") return 0;
  return event.target.valueAsNumber;
}

export function SalaryAdjustmentForm({
  bonusAmount,
  penaltyAmount,
  note,
  disabled = false,
  onBonusChange,
  onPenaltyChange,
  onNoteChange,
}: SalaryAdjustmentFormProps) {
  return (
    <section className="salary-panel-section salary-adjustments">
      <h3>Manual adjustments</h3>

      <label className="salary-field">
        <span>Bonus amount (EGP)</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={bonusAmount}
          disabled={disabled}
          onChange={(event) => onBonusChange(moneyValue(event))}
        />
        <small>Performance or mission bonus, when applicable.</small>
      </label>

      <label className="salary-field">
        <span>Penalty deduction (EGP)</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={penaltyAmount}
          disabled={disabled}
          onChange={(event) => onPenaltyChange(moneyValue(event))}
        />
        <small>Policy deduction, when applicable.</small>
      </label>

      <label className="salary-field">
        <span>
          Audit / finalization note <b>(required)</b>
        </span>
        <textarea
          rows={4}
          value={note}
          disabled={disabled}
          maxLength={1000}
          placeholder="Explain the adjustment or add the final audit note..."
          onChange={(event) => onNoteChange(event.target.value)}
        />
        <small>This note is permanently attached to the audit trail.</small>
      </label>
    </section>
  );
}

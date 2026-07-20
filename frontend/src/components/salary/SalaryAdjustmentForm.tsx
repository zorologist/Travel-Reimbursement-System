import type { ChangeEvent } from "react";
import { useLanguage } from "../../hooks/useLanguage";

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
  const { tr } = useLanguage();
  return (
    <section className="salary-panel-section salary-adjustments">
      <h3>{tr("Manual adjustments", "التعديلات اليدوية")}</h3>

      <label className="salary-field">
        <span>{tr("Bonus amount (EGP)", "قيمة المكافأة (جنيه)")}</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={bonusAmount}
          disabled={disabled}
          onChange={(event) => onBonusChange(moneyValue(event))}
        />
        <small>{tr("Performance or mission bonus, when applicable.", "مكافأة الأداء أو المأمورية عند انطباقها.")}</small>
      </label>

      <label className="salary-field">
        <span>{tr("Penalty deduction (EGP)", "قيمة الخصم (جنيه)")}</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={penaltyAmount}
          disabled={disabled}
          onChange={(event) => onPenaltyChange(moneyValue(event))}
        />
        <small>{tr("Policy deduction, when applicable.", "خصم وفقاً للائحة عند انطباقه.")}</small>
      </label>

      <label className="salary-field">
        <span>
          {tr("Audit / finalization note", "ملاحظة التدقيق / الاعتماد")} <b>{tr("(required)", "(مطلوبة)")}</b>
        </span>
        <textarea
          rows={4}
          value={note}
          disabled={disabled}
          maxLength={1000}
          placeholder={tr("Explain the adjustment or add the final audit note...", "اشرح التعديل أو أضف ملاحظة التدقيق النهائية...")}
          onChange={(event) => onNoteChange(event.target.value)}
        />
        <small>{tr("This note is permanently attached to the audit trail.", "تُرفق هذه الملاحظة بسجل الإجراءات بشكل دائم.")}</small>
      </label>
    </section>
  );
}

import type { ChangeEvent } from "react";
import { useLanguage } from "../../hooks/useLanguage";

interface SalaryAdjustmentFormProps {
  transportationCost: string;
  bonusAmount: number;
  penaltyAmount: number;
  note: string;
  disabled?: boolean;
  onBonusChange: (value: number) => void;
  onTransportationCostChange: (value: string) => void;
  onPenaltyChange: (value: number) => void;
  onNoteChange: (value: string) => void;
}

function moneyValue(event: ChangeEvent<HTMLInputElement>): number {
  if (event.target.value === "") return 0;
  return event.target.valueAsNumber;
}

export function SalaryAdjustmentForm({
  transportationCost,
  bonusAmount,
  penaltyAmount,
  note,
  disabled = false,
  onBonusChange,
  onTransportationCostChange,
  onPenaltyChange,
  onNoteChange,
}: SalaryAdjustmentFormProps) {
  const { tr } = useLanguage();
  return (
    <section className="salary-panel-section salary-adjustments">
      <h3>{tr("Manual adjustments", "التعديلات اليدوية")}</h3>

      <label className="salary-field">
        <span>{tr("Verified ticket price (EGP)", "سعر التذكرة المؤكد (جنيه)")} <b>{tr("(optional)", "(اختياري)")}</b></span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={transportationCost}
          disabled={disabled}
          onChange={(event) => {
            const val = event.target.value;
            if (val === "" || /^\d*\.?\d*$/.test(val)) {
              onTransportationCostChange(val);
            }
          }}
        />
        <small>{tr("Optional ticket price.", "سعر التذكرة (اختياري).")}</small>
      </label>

      <label className="salary-field">
        <span>{tr("Addition amount (EGP)", "قيمة الإضافة (جنيه)")} <b>{tr("(optional)", "(اختياري)")}</b></span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={bonusAmount === 0 ? "" : String(bonusAmount)}
          disabled={disabled}
          onChange={(event) => {
            const val = event.target.value;
            if (val === "" || /^\d*\.?\d*$/.test(val)) {
              onBonusChange(val === "" || val === "." ? 0 : Number(val));
            }
          }}
        />
        <small>{tr("Performance or mission addition, when applicable (optional).", "مبلغ إضافة للمأمورية عند انطباقه (اختياري).")}</small>
      </label>

      <label className="salary-field">
        <span>{tr("Penalty deduction (EGP)", "قيمة الخصم (جنيه)")} <b>{tr("(optional)", "(اختياري)")}</b></span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={penaltyAmount === 0 ? "" : String(penaltyAmount)}
          disabled={disabled}
          onChange={(event) => {
            const val = event.target.value;
            if (val === "" || /^\d*\.?\d*$/.test(val)) {
              onPenaltyChange(val === "" || val === "." ? 0 : Number(val));
            }
          }}
        />
        <small>{tr("Policy deduction, when applicable (optional).", "خصم وفقاً للائحة عند انطباقه (اختياري).")}</small>
      </label>

      <label className="salary-field">
        <span>
          {tr("Audit / finalization note", "ملاحظة التدقيق / الاعتماد")} <b>{tr("(optional)", "(اختياري)")}</b>
        </span>
        <textarea
          rows={4}
          value={note}
          disabled={disabled}
          maxLength={1000}
          placeholder={tr("Add audit note (optional)...", "أضف ملاحظة التدقيق (اختياري)...")}
          onChange={(event) => onNoteChange(event.target.value)}
        />
        <small>{tr("This note is permanently attached to the audit trail when provided.", "تُرفق هذه الملاحظة بسجل الإجراءات عند إدخالها.")}</small>
      </label>
    </section>
  );
}

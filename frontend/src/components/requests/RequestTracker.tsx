import type { WorkflowStage } from "@travel-reimbursement/shared";
import { useLanguage } from "../../hooks/useLanguage";
import { localizeLabel } from "../../i18n/format";

const workflow: Array<{ stage: WorkflowStage; label: string }> = [
  { stage: "manager-review", label: "Manager review" },
  { stage: "pr-review", label: "PR & accommodation" },
  { stage: "transportation-review", label: "Transportation review" },
  { stage: "timing-review", label: "Timing verification" },
  { stage: "salary-finalization", label: "Salary finalization" },
  { stage: "completed", label: "Completed" },
];

export function RequestTracker({ stage }: { stage: WorkflowStage }) {
  const { language, tr } = useLanguage();
  const activeIndex = stage === "cancelled" ? -1 : workflow.findIndex((item) => item.stage === stage);
  return <ol className="workflow-timeline">{workflow.map((item, index) => { const state = stage === "cancelled" ? "stopped" : index < activeIndex || stage === "completed" ? "done" : index === activeIndex ? "current" : "pending"; return <li key={item.stage} data-state={state}><i>{state === "done" ? "✓" : index + 1}</i><span><strong>{localizeLabel(item.stage, language)}</strong><small>{state === "current" ? tr("Current stage", "المرحلة الحالية") : state === "done" ? tr("Completed", "مكتمل") : state === "stopped" ? tr("Not reached", "لم يتم الوصول") : tr("Pending", "قيد الانتظار")}</small></span></li>; })}</ol>;
}

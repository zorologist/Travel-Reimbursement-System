import type { WorkflowStage } from "@travel-reimbursement/shared";

const workflow: Array<{ stage: WorkflowStage; label: string }> = [
  { stage: "manager-review", label: "Manager review" },
  { stage: "pr-review", label: "PR & accommodation" },
  { stage: "transportation-review", label: "Transportation review" },
  { stage: "timing-review", label: "Timing verification" },
  { stage: "salary-finalization", label: "Salary finalization" },
  { stage: "completed", label: "Completed" },
];

export function RequestTracker({ stage }: { stage: WorkflowStage }) {
  const activeIndex = stage === "cancelled" ? -1 : workflow.findIndex((item) => item.stage === stage);
  return <ol className="workflow-timeline">{workflow.map((item, index) => { const state = stage === "cancelled" ? "stopped" : index < activeIndex || stage === "completed" ? "done" : index === activeIndex ? "current" : "pending"; return <li key={item.stage} data-state={state}><i>{state === "done" ? "✓" : index + 1}</i><span><strong>{item.label}</strong><small>{state === "current" ? "Current stage" : state === "done" ? "Completed" : state === "stopped" ? "Not reached" : "Pending"}</small></span></li>; })}</ol>;
}

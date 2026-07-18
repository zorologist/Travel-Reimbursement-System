/* =============================================================
   EGAS · Request Tracker — Behaviour
   Renders the 7-step document workflow timeline using inline SVG
   icons. No employee names are stored or displayed anywhere in
   this file — steps are identified by role/department only.
   ============================================================= */

const CHECK_SVG = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.4"
          stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

const DOTS_SVG = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="6" cy="12" r="1.6" fill="currentColor"/>
    <circle cx="12" cy="12" r="1.6" fill="currentColor"/>
    <circle cx="18" cy="12" r="1.6" fill="currentColor"/>
  </svg>`;

/* Steps are authored right-to-left (matches the RTL reading order
   in the reference design: تم التقديم starts the flow).
   Only role/department + timestamp are shown — no personal names. */
const STEPS = [
  {
    label: "تم التقديم",
    meta: "15/07/2026",
    state: "done",
    tag: "تم إرسال الطلب"
  },
  {
    label: "مراجعة المدير المباشر",
    meta: "12:40 – 10/07/2026",
    state: "done",
    tag: "موافقة دون ملاحظات"
  },
  {
    label: "العلاقات العامة",
    meta: "11/07 – 7/07/2026",
    state: "done",
    tag: "اعتماد بلا اعتقال"
  },
  {
    label: "قسم النقل",
    meta: "09:50 – 12/07/2026",
    state: "done",
    tag: "اعداد بدل النقل"
  },
  {
    label: "مراجعة التوثيقات",
    meta: "قيد المراجعة الآن",
    state: "current",
    tag: "بانتظار الحضور"
  },
  {
    label: "تسوية الرواتب",
    meta: "لم يبدأ بعد",
    state: "pending",
    tag: "لم يبدأ بعد"
  },
  {
    label: "الاعتماد المالي المباشر",
    meta: "لم يبدأ بعد",
    state: "pending",
    tag: "لم يبدأ بعد"
  }
];

function markerContent(step, index) {
  if (step.state === "done") return CHECK_SVG;
  if (step.state === "current") return DOTS_SVG;
  return `<span>${index + 1}</span>`;
}

function tagClass(state) {
  if (state === "done") return "tl-step__tag--done";
  if (state === "current") return "tl-step__tag--current";
  return "tl-step__tag--pending";
}

function renderTimeline() {
  const list = document.getElementById("timeline");
  if (!list) return;

  list.innerHTML = STEPS.map((step, index) => `
    <li class="tl-step" data-state="${step.state}">
      <span class="tl-step__marker">${markerContent(step, index)}</span>
      <span class="tl-step__label">${step.label}</span>
      <span class="tl-step__tag ${tagClass(step.state)}">${step.tag}</span>
      <span class="tl-step__person">${step.meta}</span>
    </li>
  `).join("");
}

document.addEventListener("DOMContentLoaded", renderTimeline);

import { useState, type FormEvent } from "react";
import type { AccommodationType } from "@travel-reimbursement/shared";

import type { TravelRequestData } from "../../services/requestApi";
import { useLanguage } from "../../hooks/useLanguage";
import { localizeLabel } from "../../i18n/format";

const cities = ["Cairo", "Alexandria", "Giza", "Suez", "Ismailia", "Port Said", "Hurghada", "Matrouh", "Aswan", "Luxor", "El-Arish"];

export function RequestForm({ busy, onSubmit }: { busy: boolean; onSubmit: (input: TravelRequestData) => Promise<void> }) {
  const { language, tr } = useLanguage();
  const [form, setForm] = useState({ originCity: "Cairo", destinationCity: "", departureAt: "", returnAt: "", transportationMethod: "Company car", transportationCost: "0", accommodationType: "none" as AccommodationType, notes: "" });
  function change(name: keyof typeof form, value: string) { setForm((current) => ({ ...current, [name]: value })); }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); try { await onSubmit({ ...form, departureAt: new Date(form.departureAt).toISOString(), returnAt: new Date(form.returnAt).toISOString(), transportationCost: Number(form.transportationCost) }); } catch { /* The route displays the service error. */ } }

  return <form className="request-form-card" onSubmit={(event) => void submit(event)}><div className="request-card-line" /><div className="request-card-body">
    <section className="request-form-section"><h2>{tr("Route and schedule", "المسار والمواعيد")}</h2><div className="request-form-grid request-grid-two">
      <label className="request-form-group"><span>{tr("Travel from", "السفر من")}</span><select value={form.originCity} onChange={(event) => change("originCity", event.target.value)}>{cities.map((city) => <option key={city} value={city}>{localizeLabel(city, language)}</option>)}</select></label>
      <label className="request-form-group"><span>{tr("Destination", "الوجهة")}</span><select required value={form.destinationCity} onChange={(event) => change("destinationCity", event.target.value)}><option value="">{tr("Select a city", "اختر مدينة")}</option>{cities.map((city) => <option key={city} value={city}>{localizeLabel(city, language)}</option>)}</select></label>
      <label className="request-form-group"><span>{tr("Departure", "الذهاب")}</span><input required type="datetime-local" value={form.departureAt} onChange={(event) => change("departureAt", event.target.value)} /></label>
      <label className="request-form-group"><span>{tr("Return", "العودة")}</span><input required type="datetime-local" value={form.returnAt} min={form.departureAt} onChange={(event) => change("returnAt", event.target.value)} /></label>
    </div></section>
    <section className="request-form-section"><h2>{tr("Travel arrangements", "ترتيبات السفر")}</h2><div className="request-form-grid request-grid-two">
      <label className="request-form-group"><span>{tr("Transportation", "وسيلة الانتقال")}</span><select value={form.transportationMethod} onChange={(event) => change("transportationMethod", event.target.value)}>{["Company car", "Company bus", "Train", "Flight", "Personal car"].map((method) => <option key={method} value={method}>{localizeLabel(method, language)}</option>)}</select></label>
      <label className="request-form-group"><span>{tr("Estimated transport cost (EGP)", "تكلفة الانتقال التقديرية (جنيه)")}</span><input min="0" step="0.01" type="number" value={form.transportationCost} onChange={(event) => change("transportationCost", event.target.value)} /></label>
      <label className="request-form-group"><span>{tr("Accommodation", "الإقامة")}</span><select value={form.accommodationType} onChange={(event) => change("accommodationType", event.target.value)}><option value="none">{tr("Employee arranged / none", "على نفقة الموظف / بدون إقامة")}</option><option value="room-only">{tr("Company room only", "غرفة فقط على نفقة الشركة")}</option><option value="room-and-food">{tr("Company room and food", "غرفة ووجبات على نفقة الشركة")}</option></select></label>
    </div></section>
    <section className="request-form-section"><h2>{tr("Business note", "ملاحظة المأمورية")}</h2><label className="request-form-group"><span>{tr("Mission purpose or supporting details", "غرض المأمورية أو التفاصيل الداعمة")}</span><textarea rows={4} maxLength={500} value={form.notes} onChange={(event) => change("notes", event.target.value)} placeholder={tr("Add information that helps your manager review the request.", "أضف معلومات تساعد مديرك على مراجعة الطلب.")} /></label></section>
    <div className="request-form-actions"><button type="submit" disabled={busy}>{busy ? tr("Submitting...", "جارٍ الإرسال...") : tr("Submit for approval", "إرسال للاعتماد")}</button></div>
  </div></form>;
}

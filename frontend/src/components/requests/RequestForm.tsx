import { useState, type FormEvent } from "react";
import type { AccommodationType } from "@travel-reimbursement/shared";

import type { TravelRequestData } from "../../services/requestApi";

const cities = ["Cairo", "Alexandria", "Giza", "Suez", "Ismailia", "Port Said", "Hurghada", "Matrouh", "Aswan", "Luxor", "El-Arish"];

export function RequestForm({ busy, onSubmit }: { busy: boolean; onSubmit: (input: TravelRequestData) => Promise<void> }) {
  const [form, setForm] = useState({ originCity: "Cairo", destinationCity: "", departureAt: "", returnAt: "", transportationMethod: "Company car", transportationCost: "0", accommodationType: "none" as AccommodationType, notes: "" });
  function change(name: keyof typeof form, value: string) { setForm((current) => ({ ...current, [name]: value })); }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); try { await onSubmit({ ...form, departureAt: new Date(form.departureAt).toISOString(), returnAt: new Date(form.returnAt).toISOString(), transportationCost: Number(form.transportationCost) }); } catch { /* The route displays the service error. */ } }

  return <form className="request-form-card" onSubmit={(event) => void submit(event)}><div className="request-card-line" /><div className="request-card-body">
    <section className="request-form-section"><h2>Route and schedule</h2><div className="request-form-grid request-grid-two">
      <label className="request-form-group"><span>Travel from</span><select value={form.originCity} onChange={(event) => change("originCity", event.target.value)}>{cities.map((city) => <option key={city}>{city}</option>)}</select></label>
      <label className="request-form-group"><span>Destination</span><select required value={form.destinationCity} onChange={(event) => change("destinationCity", event.target.value)}><option value="">Select a city</option>{cities.map((city) => <option key={city}>{city}</option>)}</select></label>
      <label className="request-form-group"><span>Departure</span><input required type="datetime-local" value={form.departureAt} onChange={(event) => change("departureAt", event.target.value)} /></label>
      <label className="request-form-group"><span>Return</span><input required type="datetime-local" value={form.returnAt} min={form.departureAt} onChange={(event) => change("returnAt", event.target.value)} /></label>
    </div></section>
    <section className="request-form-section"><h2>Travel arrangements</h2><div className="request-form-grid request-grid-two">
      <label className="request-form-group"><span>Transportation</span><select value={form.transportationMethod} onChange={(event) => change("transportationMethod", event.target.value)}><option>Company car</option><option>Company bus</option><option>Train</option><option>Flight</option><option>Personal car</option></select></label>
      <label className="request-form-group"><span>Estimated transport cost (EGP)</span><input min="0" step="0.01" type="number" value={form.transportationCost} onChange={(event) => change("transportationCost", event.target.value)} /></label>
      <label className="request-form-group"><span>Accommodation</span><select value={form.accommodationType} onChange={(event) => change("accommodationType", event.target.value)}><option value="none">Employee arranged / none</option><option value="room-only">Company room only</option><option value="room-and-food">Company room and food</option></select></label>
    </div></section>
    <section className="request-form-section"><h2>Business note</h2><label className="request-form-group"><span>Mission purpose or supporting details</span><textarea rows={4} maxLength={500} value={form.notes} onChange={(event) => change("notes", event.target.value)} placeholder="Add information that helps your manager review the request." /></label></section>
    <div className="request-form-actions"><button type="submit" disabled={busy}>{busy ? "Submitting..." : "Submit for approval"}</button></div>
  </div></form>;
}

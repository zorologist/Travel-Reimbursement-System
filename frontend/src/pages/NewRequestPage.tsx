import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { AccommodationType } from "@travel-reimbursement/shared";

import { useRequests } from "../hooks/useRequests";
import { useLanguage } from "../hooks/useLanguage";
import { TimeWheelPicker } from "../components/ui/TimeWheelPicker";
import { accommodationOptions } from "../constants/accommodationOptions";
import { transportationOptions } from "../constants/transportationOptions";
import api from "../services/api";
import { developmentEmployees } from "../services/developmentRepository";
import type { RequestAttachment, TravelRequestData } from "../services/requestApi";
import "../styles/newRequest.css";

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const MAX_ATTACHMENTS = 4;
const ACCEPTED_ATTACHMENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const governorates: Array<[string, string]> = [
  ["Cairo", "القاهرة"], ["Alexandria", "الإسكندرية"], ["Giza", "الجيزة"], ["Suez", "السويس"], ["Ismailia", "الإسماعيلية"],
  ["Port Said", "بورسعيد"], ["Damietta", "دمياط"], ["Dakahlia", "الدقهلية"], ["Sharqia", "الشرقية"], ["Qalyubia", "القليوبية"],
  ["Kafr El Sheikh", "كفر الشيخ"], ["Gharbia", "الغربية"], ["Monufia", "المنوفية"], ["Beheira", "البحيرة"], ["Fayoum", "الفيوم"],
  ["Beni Suef", "بني سويف"], ["Minya", "المنيا"], ["Assiut", "أسيوط"], ["Sohag", "سوهاج"], ["Qena", "قنا"], ["Luxor", "الأقصر"], ["Aswan", "أسوان"],
];

interface ManagerOption {
  id: string;
  employeeNumber: string;
  displayName: string;
  department: string;
}

function readAttachment(file: File): Promise<RequestAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("تعذر قراءة الملف المرفق. يرجى اختيار ملف آخر."));
    reader.onload = () => resolve({
      id: crypto.randomUUID(),
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      url: String(reader.result),
    });
    reader.readAsDataURL(file);
  });
}

export default function NewRequestPage() {
  const navigate = useNavigate();
  const { direction, language, localizeError, tr } = useLanguage();
  const { addRequest, loading, error } = useRequests();
  const [localError, setLocalError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [form, setForm] = useState({
    travelFrom: "",
    travelTo: "",
    startDate: "",
    startTime: "08:00",
    endDate: "",
    returnTime: "08:00",
    transport: "company-car",
    ticketAmount: "",
    accommodation: "room-and-food" as AccommodationType,
    notes: "",
    tripType: "round-trip" as "one-way" | "round-trip",
    managerId: "",
  });

  // Fetch the list of managers once on mount so the employee can route the request.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await api.get<{ managers: ManagerOption[] }>("/api/managers");
        if (cancelled) return;
        const list = response.data.managers ?? [];
        setManagers(list);
        setForm((current) => (current.managerId ? current : { ...current, managerId: list[0]?.id ?? "" }));
      } catch {
        // The browser-only development repository has no /api/managers endpoint — fall back to a
        // hard-coded demo manager so the form remains usable in that mode.
        const fallback: ManagerOption[] = developmentEmployees
          .filter((employee) => employee.roles.includes("manager"))
          .map(({ id, employeeNumber, displayName, department }) => ({ id, employeeNumber, displayName, department }));
        if (cancelled) return;
        setManagers(fallback);
        setForm((current) => (current.managerId ? current : { ...current, managerId: fallback[0].id }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setLocalError(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length > MAX_ATTACHMENTS) {
      setAttachments([]);
      setLocalError(tr("Attach no more than 4 ticket images.", "أرفق بحد أقصى 4 صور للتذكرة."));
      event.target.value = "";
      return;
    }
    if (files.some((file) => file.size > MAX_ATTACHMENT_SIZE)) {
      setAttachments([]);
      setLocalError(tr("Each image must not exceed 5 MB.", "يجب ألا يتجاوز حجم كل صورة 5 ميجابايت."));
      event.target.value = "";
      return;
    }
    if (files.some((file) => !ACCEPTED_ATTACHMENT_TYPES.has(file.type))) {
      setAttachments([]);
      setLocalError(tr("Ticket attachments must be JPG, PNG, or WebP images.", "يجب أن تكون مرفقات التذكرة بصيغة JPG أو PNG أو WebP."));
      event.target.value = "";
      return;
    }
    setAttachments(files);
    setLocalError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLocalError(null);

    if (!form.managerId) {
      setLocalError(tr("Please select the manager who should review this request.", "يرجى اختيار المدير الذي سيراجع هذا الطلب."));
      return;
    }
    if (attachments.length === 0) {
      setLocalError(tr("Attach at least one ticket image.", "أرفق صورة واحدة على الأقل للتذكرة."));
      return;
    }

    try {
      const requestAttachments = await Promise.all(attachments.map(readAttachment));
      // For one-way trips, the API still needs a returnAt for schema compatibility — use the
      // departure date as the placeholder so the backend validation passes. The tripType flag
      // is what actually signals one-way vs round-trip downstream.
      const fallbackReturnDate = form.tripType === "one-way" ? form.startDate : form.endDate;
      const fallbackReturnTime = form.tripType === "one-way" ? form.startTime : form.returnTime;
      const requestData: TravelRequestData = {
        originCity: form.travelFrom,
        destinationCity: form.travelTo,
        departureAt: new Date(`${form.startDate}T${form.startTime}`).toISOString(),
        returnAt: new Date(`${fallbackReturnDate}T${fallbackReturnTime}`).toISOString(),
        tripType: form.tripType,
        managerId: form.managerId,
        transportationMethod: transportationOptions.find((option) => option.formValue === form.transport)?.value ?? "Company car",
        transportationCost: form.transport !== "company-car" ? Number(form.ticketAmount) : 0,
        accommodationType: form.accommodation,
        notes: form.notes,
        attachments: requestAttachments,
      };
      const created = await addRequest(requestData);
      alert(tr("The travel request was submitted successfully!", "تم إرسال طلب السفر بنجاح!"));
      navigate(`/requests/${created.id}`, { replace: true });
    } catch (submitError) {
      if (submitError instanceof RangeError) {
        setLocalError(tr("Enter valid travel dates and times.", "يرجى إدخال تواريخ وأوقات صحيحة للرحلة."));
      } else if (submitError instanceof Error) {
        setLocalError(localizeError(submitError, "Unable to submit the request.", "تعذر إرسال الطلب."));
      } else {
        setLocalError(tr("An error occurred while submitting the request.", "حدث خطأ أثناء إرسال الطلب."));
      }
    }
  };

  const isPersonalTransport = form.transport !== "company-car";
  const isOneWay = form.tripType === "one-way";
  const displayedError = localError ?? error;

  return (
    <div className="max-w-4xl mx-auto my-8 p-8 bg-white rounded-2xl shadow-sm border border-gray-100" dir={direction}>
      <div className="bg-[#1E5A34] text-white p-6 rounded-xl mb-8 relative overflow-hidden">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold">{tr("Submit a New Travel Request", "تقديم طلب سفر جديد")}</h2>
          <span className="bg-white/20 text-xs px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            {tr("Draft", "قيد الإعداد")}
          </span>
        </div>
        <p className="text-emerald-100/80 text-sm">{tr("Complete the information below to submit the request for review.", "يرجى ملء البيانات أدناه لإرسال الطلب للمراجعة")}</p>
      </div>

      {displayedError && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 border border-red-100 rounded-xl text-sm" role="alert">
          {displayedError === "CONFLICT" ? tr("This request conflicts with another mission's dates.", "تنبيه: هناك تعارض في تواريخ الطلب مع مأمورية أخرى.")
            : displayedError === "FORBIDDEN" ? tr("You do not have permission to complete this action.", "عذراً، ليس لديك الصلاحية لإتمام هذا الإجراء.")
              : displayedError === "SERVER_ERROR" ? tr("The server could not be reached. Please try again later.", "حدث خطأ في الاتصال بالخادم، يرجى المحاولة لاحقاً.")
                : displayedError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <fieldset className="border-t border-gray-200 pt-4">
          <legend className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-2">{tr("Manager & trip type", "المدير ونوع الرحلة")}</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Select manager to review", "اختر المدير المسؤول")}</label>
              <select
                name="managerId"
                value={form.managerId}
                onChange={handleChange}
                className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all"
                required
              >
                <option value="">{tr("Select a manager", "اختر مديراً")}</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.displayName} — {manager.department}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Trip type", "نوع الرحلة")}</label>
              <div className="trip-type-radio-group" role="radiogroup" aria-label={tr("Trip type", "نوع الرحلة")}>
                <label className={`trip-type-radio ${form.tripType === "round-trip" ? "is-active" : ""}`}>
                  <input
                    type="radio"
                    name="tripType"
                    value="round-trip"
                    checked={form.tripType === "round-trip"}
                    onChange={handleChange}
                  />
                  <span>{tr("Round trip", "ذهاب وعودة")}</span>
                </label>
                <label className={`trip-type-radio ${form.tripType === "one-way" ? "is-active" : ""}`}>
                  <input
                    type="radio"
                    name="tripType"
                    value="one-way"
                    checked={form.tripType === "one-way"}
                    onChange={handleChange}
                  />
                  <span>{tr("One way", "ذهاب فقط")}</span>
                </label>
              </div>
              {isOneWay && (
                <p className="text-amber-600 text-xs mt-1.5">💡 {tr("Return date and time are hidden for one-way trips.", "تاريخ ووقت العودة مخفيان للرحلات في اتجاه واحد.")}</p>
              )}
            </div>
          </div>
        </fieldset>

        <fieldset className="border-t border-gray-200 pt-4">
          <legend className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-2">{tr("Travel route", "مسار الرحلة")}</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Travel from", "السفر من")}</label>
              <select name="travelFrom" value={form.travelFrom} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all" required>
                <option value="">{tr("Departure city", "مدينة الانطلاق")}</option>
                {governorates.map(([english, arabic]) => <option key={english} value={english}>{language === "ar" ? arabic : english}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Travel to (destination)", "السفر إلى (الوجهة)")}</label>
              <select name="travelTo" value={form.travelTo} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all" required>
                <option value="">{tr("Select a destination city", "اختر مدينة الوجهة")}</option>
                {governorates.map(([english, arabic]) => <option key={english} value={english}>{language === "ar" ? arabic : english}</option>)}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset className="border-t border-gray-200 pt-4">
          <legend className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-2">{tr("Dates and times", "المواعيد والتواريخ")}</legend>
          <div className={`grid grid-cols-1 ${isOneWay ? "md:grid-cols-1" : "md:grid-cols-3"} gap-6`}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Departure date", "تاريخ الذهاب")}</label>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all" required />
            </div>
            {!isOneWay && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Return date", "تاريخ العودة")}</label>
                <input type="date" name="endDate" value={form.endDate} min={form.startDate || undefined} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all" required />
              </div>
            )}
            {!isOneWay && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Return time", "ساعة العودة")}</label>
                <TimeWheelPicker
                  value={form.returnTime}
                  ariaLabel={tr("Select return time", "اختيار ساعة العودة")}
                  onChange={(returnTime) => {
                    setForm((current) => ({ ...current, returnTime }));
                    setLocalError(null);
                  }}
                />
                <input type="hidden" name="returnTime" value={form.returnTime} />
              </div>
            )}
          </div>
        </fieldset>

        <fieldset className="border-t border-gray-200 pt-4">
          <legend className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-2">{tr("Transportation and costs", "وسيلة الانتقال والتكاليف")}</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Transportation", "وسيلة الانتقال")}</label>
              <select name="transport" value={form.transport} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all">
                {transportationOptions.map((option) => <option key={option.formValue} value={option.formValue}>{tr(option.english, option.arabic)}</option>)}
              </select>
            </div>
            {isPersonalTransport && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Amount paid (EGP)", "المبلغ المدفوع (جنيه)")}</label>
                <div className="relative">
                  <input type="number" min="0" step="0.01" name="ticketAmount" value={form.ticketAmount} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all pl-12" placeholder={tr("Enter the amount paid", "أدخل المبلغ المدفوع")} required />
                  <span className="absolute left-3 top-3 text-sm text-gray-400 font-medium">EGP</span>
                </div>
                <p className="text-amber-600 text-xs mt-1.5">💡 {tr("This amount is required to review the transportation reimbursement.", "المبلغ مطلوب لمراجعة قيمة تعويض الانتقال.")}</p>
              </div>
            )}
          </div>
        </fieldset>

        <fieldset className="border-t border-gray-200 pt-4 animate-fadeIn">
            <legend className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-2">{tr("Documents and attachments", "المستندات والمرفقات")}</legend>
            <label htmlFor="file-upload" className="block border-2 border-dashed border-gray-200 hover:border-[#1E5A34] bg-gray-50/30 rounded-xl p-6 text-center cursor-pointer transition-colors group">
              <span className="flex flex-col items-center justify-center space-y-2">
                <span className="p-3 bg-emerald-50 rounded-full text-[#1E5A34] group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                </span>
                <span className="text-sm font-semibold text-gray-700">{attachments.length > 0 ? tr(`${attachments.length} ticket image(s) selected`, `تم اختيار ${attachments.length} صورة للتذكرة`) : tr("Attach the travel ticket or receipt", "ارفق تذكرة السفر أو الإيصال")}</span>
                <span className="text-xs text-gray-400">{tr("Required: 1–4 JPG, PNG, or WebP images; maximum 5 MB each", "مطلوب: من 1 إلى 4 صور JPG أو PNG أو WebP؛ بحد أقصى 5 ميجابايت لكل صورة")}</span>
                {attachments.map((file) => <span key={`${file.name}-${file.lastModified}`} className="text-xs text-gray-500">{file.name}</span>)}
              </span>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple required className="hidden" id="file-upload" onChange={handleFileChange} />
            </label>
          </fieldset>

        <fieldset className="border-t border-gray-200 pt-4">
          <legend className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-2">{tr("Accommodation and arrangements", "الإقامة والتوجيهات")}</legend>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Accommodation type", "نوع الإقامة")}</label>
              <select name="accommodation" value={form.accommodation} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all">
                {accommodationOptions.map((option) => <option key={option.value} value={option.value}>{tr(option.english, option.arabic)}</option>)}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset className="border-t border-gray-200 pt-4">
          <legend className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-2">{tr("Notes", "الملاحظات")}</legend>
          <textarea name="notes" rows={4} value={form.notes} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all resize-none" placeholder={tr("Add any notes or extra details here...", "اكتب أي ملاحظات أو تفاصيل إضافية هنا...")} />
        </fieldset>

        <button type="submit" disabled={loading} className="w-full bg-[#1E5A34] text-white p-4 rounded-xl font-bold text-base shadow-sm hover:bg-[#153f24] active:scale-[0.99] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all mt-4">
          {loading ? tr("Submitting request...", "جاري إرسال الطلب...") : tr("Submit request for approval", "إرسال الطلب للاعتماد")}
        </button>
      </form>
    </div>
  );
}

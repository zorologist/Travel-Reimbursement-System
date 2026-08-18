import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  earliestTravelDateInputValue,
  JOB_LEVEL_OPTIONS,
  type AccommodationType,
  type JobLevel,
} from "@travel-reimbursement/shared";

import { useRequests } from "../hooks/useRequests";
import { useLanguage } from "../hooks/useLanguage";
import { accommodationOptions } from "../constants/accommodationOptions";
import { transportationOptions } from "../constants/transportationOptions";
import api from "../services/api";
import { developmentEmployees } from "../services/developmentRepository";
import { useDevelopmentRepository } from "../services/runtimeMode";
import type { RequestAttachment, TravelRequestData } from "../services/requestApi";
import { randomId } from "../utils/randomId";
import "../styles/newRequest.css";

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const MAX_ATTACHMENTS = 4;
const ACCEPTED_ATTACHMENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const governorates: Array<[string, string]> = [
  ["Cairo", "القاهرة"], ["Alexandria", "الإسكندرية"], ["Giza", "الجيزة"], ["Suez", "السويس"], ["Ismailia", "الإسماعيلية"],
  ["Port Said", "بورسعيد"], ["Damietta", "دمياط"], ["Dakahlia", "الدقهلية"], ["Sharqia", "الشرقية"], ["Qalyubia", "القليوبية"],
  ["Kafr El Sheikh", "كفر الشيخ"], ["Gharbia", "الغربية"], ["Monufia", "المنوفية"], ["Beheira", "البحيرة"], ["Fayoum", "الفيوم"],
  ["Beni Suef", "بني سويف"], ["Minya", "المنيا"], ["Assiut", "أسيوط"], ["Sohag", "سوهاج"], ["Qena", "قنا"], ["Luxor", "الأقصر"], ["Aswan", "أسوان"],
  // Specific train stations from the ENR tariff sheet, listed alongside their governorate
  // above (e.g. Tanta is a Gharbia station) since train fares are priced per station, not per governorate.
  ["Benha", "بنها"], ["Qewaisna", "قويسنا"], ["Berket El Sabaa", "بركة السبع"], ["Tanta", "طنطا"],
  ["Itay El Baroud", "إيتاي البارود"], ["Damanhur", "دمنهور"], ["Kafr El Zayat", "كفر الزيات"],
  ["Mansoura", "المنصورة"], ["Samannoud", "سمنود"], ["El Mahalla El Kubra", "المحلة الكبرى"], ["Mahram Bek", "محرم بك"],
  ["Borg El Arab", "برج العرب"], ["El Hammam", "الحمام"], ["El Alamein", "العلمين"], ["Sidi Abdel Rahman", "سيدي عبدالرحمن"],
  ["El Dabaa", "الضبعة"], ["Marsa Matrouh", "مرسى مطروح"], ["El Tal El Kebir", "التل الكبير"], ["El Qantara Gharb", "القنطرة غرب"],
  ["Fayed", "فايد"], ["Meniat El Qamh", "منية القمح"], ["Zagazig", "الزقازيق"], ["Zifta", "زفتى"],
  ["El Qassassin", "القصاصين"], ["El Santa", "السنطة"], ["Qutur", "قطور"], ["Menouf", "منوف"], ["Ashmoun", "اشمون"],
  ["Nag Hammadi", "نجع حمادى"], ["Edfu", "إدفو"], ["Kom Ombo", "كوم امبو"], ["Al Ayyat", "العياط"], ["El Wasta", "الواسطى"],
  ["Beni Mazar", "بني مزار"], ["Matay", "مطاي"], ["Samalut", "سمالوط"], ["Malawi", "ملوي"], ["Dairut", "ديروط"],
  ["El Qusiya", "القوصية"], ["Manfalut", "منفلوط"], ["Manqabad", "منقباد"], ["Abu Tig", "أبو تيج"], ["Sedfa", "صدفا"],
  ["Tima", "طما"], ["Tahta", "طهطا"], ["El Maragha", "المراغة"], ["El Menshah", "المنشأة"], ["Girga", "جرجا"],
  ["El Balyana", "البلينا"], ["Qift", "قفط"], ["Esna", "إسنا"], ["Kalabsha", "كلابشة"], ["Aswan High Dam", "السد العالي"],
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
      id: randomId(),
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
  const earliestAllowedTravelDate = earliestTravelDateInputValue();
  const [form, setForm] = useState({
    jobLevel: "" as JobLevel | "",
    travelFrom: "",
    travelTo: "",
    startDate: "",
    startTime: "08:00",
    endDate: "",
    returnTime: "08:00",
    transport: "company-car",
    ticketAmount: "",
    accommodation: "egas-arranged" as AccommodationType,
    notes: "",
    tripType: "round-trip" as "one-way" | "round-trip",
    managerId: "",
  });

  // Fetch the list of managers once on mount so the employee can route the request.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (useDevelopmentRepository) {
        // The explicit browser-only repository has no /api/managers endpoint.
        const fallback: ManagerOption[] = developmentEmployees
          .filter((employee) => employee.roles.includes("manager"))
          .map(({ id, employeeNumber, displayName, department }) => ({ id, employeeNumber, displayName, department }));
        if (cancelled) return;
        setManagers(fallback);
        setForm((current) => (current.managerId ? current : { ...current, managerId: fallback[0]?.id ?? "" }));
        return;
      }

      try {
        const response = await api.get<{ managers: ManagerOption[] }>("/api/managers");
        if (cancelled) return;
        const list = response.data.managers ?? [];
        setManagers(list);
        setForm((current) => (current.managerId ? current : { ...current, managerId: list[0]?.id ?? "" }));
      } catch (managerError) {
        if (!cancelled) {
          setManagers([]);
          setLocalError(localizeError(managerError, "Unable to load the manager list.", "تعذر تحميل قائمة المديرين."));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [localizeError]);

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
    if (!form.jobLevel) {
      setLocalError(tr("Please select your job level.", "يرجى اختيار المستوى الوظيفي."));
      return;
    }
    if (!form.travelFrom || !form.travelTo) {
      setLocalError(tr("Please select both departure and destination cities.", "يرجى اختيار مدينة الانطلاق ومدينة الوجهة."));
      return;
    }
    if (!form.startDate || (form.tripType === "round-trip" && !form.endDate)) {
      setLocalError(tr("Please enter the required travel dates.", "يرجى إدخال تواريخ السفر المطلوبة."));
      return;
    }
    const isMultiDay = form.tripType === "round-trip"
      && Boolean(form.startDate && form.endDate && form.startDate !== form.endDate);
    if (isMultiDay && !form.returnTime) {
      setLocalError(tr("Return time is required for trips lasting more than one day.", "يرجى تحديد وقت العودة للمأموريات التي تستغرق أكثر من يوم."));
      return;
    }
    if (!form.notes.trim()) {
      setLocalError(tr("Please enter the purpose of the mission.", "يرجى إدخال غرض المأمورية."));
      return;
    }

    const isPersonalCar = form.transport === "personal-car";
    if (isPersonalCar && attachments.length === 0) {
      setLocalError(tr("Please attach the required ticket or supporting document for Employee's Private Car.", "يرجى إرفاق المستند/التذكرة المطلوبة عند اختيار سيارة شخصية."));
      return;
    }

    try {
      const requestAttachments = await Promise.all(attachments.map(readAttachment));
      const requestReturnDate = form.tripType === "one-way"
        ? form.startDate
        : form.endDate || form.startDate;
      const requestReturnTime = form.tripType === "one-way" ? form.startTime : form.returnTime;
      const requestData: TravelRequestData = {
        originCity: form.travelFrom,
        destinationCity: form.travelTo,
        departureAt: new Date(`${form.startDate}T${form.startTime}`).toISOString(),
        returnAt: new Date(`${requestReturnDate}T${requestReturnTime}`).toISOString(),
        tripType: form.tripType,
        managerId: form.managerId,
        jobLevel: form.jobLevel,
        transportationMethod: transportationOptions.find((option) => option.formValue === form.transport)?.value ?? "Company Car",
        transportationCost: form.ticketAmount ? Number(form.ticketAmount) : 0,
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

  const isPersonalTransport = form.transport === "personal-car";
  const isOneWay = form.tripType === "one-way";
  const isSameDayTrip = !isOneWay && form.startDate && form.startDate === form.endDate;
  const isMultiDayTrip = !isOneWay && Boolean(form.startDate && form.endDate && form.startDate !== form.endDate);
  
  // Calculate duration hours for same day trips
  let sameDayHours = 0;
  if (isSameDayTrip && form.startTime && form.returnTime) {
    const [startH, startM] = form.startTime.split(":").map(Number);
    const [returnH, returnM] = form.returnTime.split(":").map(Number);
    sameDayHours = (returnH * 60 + returnM - (startH * 60 + startM)) / 60;
  }
  const isUnderSevenHours = isSameDayTrip && sameDayHours < 7;

  const displayedError = localError ?? (error ? localizeError(error) : null);

  return (
    <div className="max-w-4xl mx-auto my-8 p-8 bg-white rounded-2xl shadow-sm border border-gray-100" dir={direction}>
      <div className="bg-[#1E5A34] text-white p-6 rounded-xl mb-8 relative overflow-hidden">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold">{tr("Travel & Transportation Allowance Request Outside Greater Cairo", "طلب بدل السفر والانتقالات خارج القاهرة الكبرى")}</h2>
          <span className="bg-white/20 text-xs px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            {tr("Draft", "قيد الإعداد")}
          </span>
        </div>
        <p className="text-emerald-100/80 text-sm">{tr("Complete the information below to submit the request for review.", "يرجى ملء البيانات أدناه لإرسال الطلب للمراجعة")}</p>
      </div>

      {displayedError && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 border border-red-100 rounded-xl text-sm" role="alert">
          {displayedError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <fieldset className="border-t border-gray-200 pt-4">
          <legend className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-2">{tr("Employee level, Manager & trip type", "المستوى الوظيفي والمدير ونوع الرحلة")}</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="job-level" className="block text-sm font-medium text-gray-700 mb-2">{tr("Job level", "المستوى الوظيفي")} *</label>
              <select
                id="job-level"
                name="jobLevel"
                value={form.jobLevel}
                onChange={handleChange}
                className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all"
                required
              >
                <option value="">{tr("Select your job level", "اختر المستوى الوظيفي")}</option>
                {JOB_LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {language === "ar" ? option.arabic : option.english}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">{tr("Choose the level that applies to this request. It will be reviewed later.", "اختر المستوى المطبق على هذا الطلب، وسيتم مراجعته لاحقاً.")}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Select manager to review", "اختر المدير المسؤول")} *</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Trip type", "نوع الرحلة")} *</label>
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
                  <span>{tr("One way", "اتجاه واحد")}</span>
                </label>
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className="border-t border-gray-200 pt-4">
          <legend className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-2">{tr("Travel route", "مسار الرحلة")}</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Travel from", "السفر من")} *</label>
              <select name="travelFrom" value={form.travelFrom} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all" required>
                <option value="">{tr("Departure city", "مدينة الانطلاق")}</option>
                {governorates.map(([english, arabic]) => <option key={english} value={english}>{language === "ar" ? arabic : english}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Travel to (destination)", "السفر إلى (الوجهة)")} *</label>
              <select name="travelTo" value={form.travelTo} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all" required>
                <option value="">{tr("Select a destination city", "اختر مدينة الوجهة")}</option>
                {governorates.map(([english, arabic]) => <option key={english} value={english}>{language === "ar" ? arabic : english}</option>)}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset className="border-t border-gray-200 pt-4">
          <legend className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-2">{tr("Dates and times", "المواعيد والتواريخ")}</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Departure date", "تاريخ الذهاب")} *</label>
              <input type="date" name="startDate" value={form.startDate} min={earliestAllowedTravelDate} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all" required />
              <p className="text-xs text-gray-500 mt-2">{tr("Trips from the previous month can still be submitted.", "يمكن تقديم طلبات الرحلات التي تمت خلال الشهر السابق.")}</p>
            </div>
            {!isOneWay && <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Return date", "تاريخ العودة")} *</label>
              <input type="date" name="endDate" value={form.endDate} min={form.startDate || undefined} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all" required />
            </div>}
          </div>
          {isOneWay && (
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Departure time", "وقت المغادرة")} *</label>
              <input type="time" name="startTime" value={form.startTime} onChange={handleChange} className="w-full bg-white border border-gray-200 p-3 rounded-lg text-gray-800 focus:border-[#1E5A34] focus:outline-none transition-all" required />
              <p className="text-xs text-gray-500 mt-2">{tr("A one-way request has no return date or return time.", "طلب الاتجاه الواحد لا يحتوي على تاريخ أو وقت عودة.")}</p>
            </div>
          )}
          {isSameDayTrip && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Departure time", "وقت الذهاب")} *</label>
                <input type="time" name="startTime" value={form.startTime} onChange={handleChange} className="w-full bg-white border border-gray-200 p-3 rounded-lg text-gray-800 focus:border-[#1E5A34] focus:outline-none transition-all" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Return time", "وقت العودة")} *</label>
                <input type="time" name="returnTime" value={form.returnTime} onChange={handleChange} className="w-full bg-white border border-gray-200 p-3 rounded-lg text-gray-800 focus:border-[#1E5A34] focus:outline-none transition-all" required />
              </div>
              {isUnderSevenHours && (
                <div className="col-span-1 md:col-span-2 text-amber-700 text-xs font-medium bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{tr("Trip duration is less than 7 hours. The daily allowance will not be calculated.", "مدة المأمورية أقل من 7 ساعات (لن يتم حساب بدل المأمورية لهذه الرحلة).")}</span>
                </div>
              )}
            </div>
          )}
          {isMultiDayTrip && (
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Return time on last day", "وقت العودة (في اليوم الأخير)")} *</label>
              <input type="time" name="returnTime" value={form.returnTime} onChange={handleChange} className="w-full bg-white border border-gray-200 p-3 rounded-lg text-gray-800 focus:border-[#1E5A34] focus:outline-none transition-all" required />
              <p className="text-xs text-gray-500 mt-2">
                💡 {tr("Departure time is constant at 08:00 AM. Returning at 03:00 PM (15:00) or later calculates allowance for the final day.", "وقت الذهاب ثابت الساعة 08:00 صباحاً. العودة الساعة 03:00 عصراً (15:00) أو بعدها يحسب بدل اليوم الأخير.")}
              </p>
            </div>
          )}
        </fieldset>

        <fieldset className="border-t border-gray-200 pt-4">
          <legend className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-2">{tr("Transportation and costs", "وسيلة الانتقال والتكاليف")}</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Transportation", "وسيلة الانتقال")} *</label>
              <select name="transport" value={form.transport} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all" required>
                {transportationOptions.map((option) => <option key={option.formValue} value={option.formValue}>{tr(option.english, option.arabic)}</option>)}
              </select>
            </div>
            {isPersonalTransport && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Amount paid / Ticket price (EGP)", "المبلغ المدفوع / قيمة التذكرة (جنيه)")} <span className="text-xs text-gray-400 font-normal">({tr("Optional", "اختياري")})</span></label>
                <div className="relative">
                  <input type="number" min="0" step="0.01" name="ticketAmount" value={form.ticketAmount} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all pl-12" placeholder={tr("Enter ticket price", "أدخل قيمة التذكرة")} />
                  <span className="absolute left-3 top-3 text-sm text-gray-400 font-medium">EGP</span>
                </div>
              </div>
            )}
          </div>
        </fieldset>

        <fieldset className="border-t border-gray-200 pt-4 animate-fadeIn">
            <legend className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-2">{tr("Documents and attachments", "المستندات والمرفقات")} {isPersonalTransport && "*"}</legend>
            <label htmlFor="file-upload" className="block border-2 border-dashed border-gray-200 hover:border-[#1E5A34] bg-gray-50/30 rounded-xl p-6 text-center cursor-pointer transition-colors group">
              <span className="flex flex-col items-center justify-center space-y-2">
                <span className="p-3 bg-emerald-50 rounded-full text-[#1E5A34] group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                </span>
                <span className="text-sm font-semibold text-gray-700">{attachments.length > 0 ? tr(`${attachments.length} ticket image(s) selected`, `تم اختيار ${attachments.length} صورة للتذكرة`) : tr("Attach the travel ticket or receipt", "ارفق تذكرة السفر أو الإيصال")}</span>
                <span className="text-xs text-gray-400">{isPersonalTransport ? tr("Required for Employee's Private Car: 1–4 JPG, PNG, or WebP images", "مطلوب للسيارة الشخصية: من 1 إلى 4 صور بصيغة JPG أو PNG أو WebP") : tr("1–4 JPG, PNG, or WebP images; maximum 5 MB each", "من 1 إلى 4 صور JPG أو PNG أو WebP؛ بحد أقصى 5 ميجابايت")}</span>
                {attachments.map((file) => <span key={`${file.name}-${file.lastModified}`} className="text-xs text-gray-500">{file.name}</span>)}
              </span>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" id="file-upload" onChange={handleFileChange} />
            </label>
          </fieldset>

        <fieldset className="border-t border-gray-200 pt-4">
          <legend className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-2">{tr("Accommodation type", "نوع الإقامة")} *</legend>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <select name="accommodation" value={form.accommodation} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all" required>
                {accommodationOptions.map((option) => <option key={option.value} value={option.value}>{tr(option.english, option.arabic)}</option>)}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset className="border-t border-gray-200 pt-4">
          <legend className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-2">{tr("Purpose of the Mission", "غرض المأمورية")} *</legend>
          <textarea name="notes" rows={4} value={form.notes} onChange={handleChange} required className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all resize-none" placeholder={tr("Specify the purpose of the mission...", "اكتب غرض المأمورية هنا...")} />
        </fieldset>

        <button type="submit" disabled={loading} className="w-full bg-[#1E5A34] text-white p-4 rounded-xl font-bold text-base shadow-sm hover:bg-[#153f24] active:scale-[0.99] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all mt-4">
          {loading ? tr("Submitting request...", "جاري إرسال الطلب...") : tr("Submit request for approval", "إرسال الطلب للاعتماد")}
        </button>
      </form>
    </div>
  );
}

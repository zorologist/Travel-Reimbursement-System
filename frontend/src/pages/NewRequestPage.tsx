import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { AccommodationType } from "@travel-reimbursement/shared";

import { useRequests } from "../hooks/useRequests";
import { useLanguage } from "../hooks/useLanguage";
import { TimeWheelPicker } from "../components/ui/TimeWheelPicker";
import type { RequestAttachment, TravelRequestData } from "../services/requestApi";
import "../styles/newRequest.css";

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;

const governorates: Array<[string, string]> = [
  ["Cairo", "القاهرة"], ["Alexandria", "الإسكندرية"], ["Giza", "الجيزة"], ["Suez", "السويس"], ["Ismailia", "الإسماعيلية"],
  ["Port Said", "بورسعيد"], ["Damietta", "دمياط"], ["Dakahlia", "الدقهلية"], ["Sharqia", "الشرقية"], ["Qalyubia", "القليوبية"],
  ["Kafr El Sheikh", "كفر الشيخ"], ["Gharbia", "الغربية"], ["Monufia", "المنوفية"], ["Beheira", "البحيرة"], ["Fayoum", "الفيوم"],
  ["Beni Suef", "بني سويف"], ["Minya", "المنيا"], ["Assiut", "أسيوط"], ["Sohag", "سوهاج"], ["Qena", "قنا"], ["Luxor", "الأقصر"], ["Aswan", "أسوان"],
];

const accommodationTypes: Record<string, AccommodationType> = {
  "full-board": "room-and-food",
  "half-board": "room-and-food",
  "no-meals": "room-only",
  "company-bnb": "room-and-food",
  "employee-arranged": "none",
};

const transportationMethods: Record<string, string> = {
  "company-car": "Company car",
  "personal-car": "Personal car",
  "other": "Other transport",
};

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
  const [attachment, setAttachment] = useState<File | null>(null);
  const [form, setForm] = useState({
    travelFrom: "",
    travelTo: "",
    startDate: "",
    startTime: "08:00",
    endDate: "",
    returnTime: "08:00",
    transport: "company-car",
    ticketAmount: "",
    accommodation: "full-board",
    notes: "",
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setLocalError(null);
    if (name === "transport" && value === "company-car") setAttachment(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file && file.size > MAX_ATTACHMENT_SIZE) {
      setAttachment(null);
      setLocalError(tr("The attachment must not exceed 5 MB.", "حجم المرفق يجب ألا يتجاوز 5 ميجابايت."));
      event.target.value = "";
      return;
    }
    setAttachment(file);
    setLocalError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLocalError(null);

    try {
      const attachments = attachment ? [await readAttachment(attachment)] : undefined;
      const requestData: TravelRequestData = {
        originCity: form.travelFrom,
        destinationCity: form.travelTo,
        departureAt: new Date(`${form.startDate}T${form.startTime}`).toISOString(),
        returnAt: new Date(`${form.endDate}T${form.returnTime}`).toISOString(),
        transportationMethod: transportationMethods[form.transport],
        transportationCost: form.transport !== "company-car" ? Number(form.ticketAmount) : 0,
        accommodationType: accommodationTypes[form.accommodation],
        notes: form.notes,
        attachments,
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Departure date", "تاريخ الذهاب")}</label>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Return date", "تاريخ العودة")}</label>
              <input type="date" name="endDate" value={form.endDate} min={form.startDate || undefined} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all" required />
            </div>
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
          </div>
        </fieldset>

        <fieldset className="border-t border-gray-200 pt-4">
          <legend className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-2">{tr("Transportation and costs", "وسيلة الانتقال والتكاليف")}</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Transportation", "وسيلة الانتقال")}</label>
              <select name="transport" value={form.transport} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all">
                <option value="company-car">{tr("Company car", "سيارة الشركة")}</option>
                <option value="personal-car">{tr("Personal car", "سيارة خاصة (شخصية)")}</option>
                <option value="other">{tr("Other non-company transportation", "وسيلة أخرى غير تابعة للشركة")}</option>
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

        {isPersonalTransport && (
          <fieldset className="border-t border-gray-200 pt-4 animate-fadeIn">
            <legend className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-2">{tr("Documents and attachments", "المستندات والمرفقات")}</legend>
            <label htmlFor="file-upload" className="block border-2 border-dashed border-gray-200 hover:border-[#1E5A34] bg-gray-50/30 rounded-xl p-6 text-center cursor-pointer transition-colors group">
              <span className="flex flex-col items-center justify-center space-y-2">
                <span className="p-3 bg-emerald-50 rounded-full text-[#1E5A34] group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                </span>
                <span className="text-sm font-semibold text-gray-700">{attachment ? attachment.name : tr("Attach the travel ticket or receipt", "ارفق تذكرة السفر أو الإيصال")}</span>
                <span className="text-xs text-gray-400">{attachment ? tr("Click to select another file", "اضغط لاختيار ملف آخر") : tr("Click or drag a file here (PNG, JPG, PDF — maximum 5 MB)", "اضغط هنا أو اسحب الملف لرفعه (PNG, JPG, PDF — بحد أقصى 5MB)")}</span>
              </span>
              <input type="file" accept="image/*,.pdf" className="hidden" id="file-upload" onChange={handleFileChange} />
            </label>
          </fieldset>
        )}

        <fieldset className="border-t border-gray-200 pt-4">
          <legend className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-2">{tr("Accommodation and arrangements", "الإقامة والتوجيهات")}</legend>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr("Accommodation type", "نوع الإقامة")}</label>
              <select name="accommodation" value={form.accommodation} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all">
                <option value="full-board">{tr("Full board", "إقامة كاملة")}</option>
                <option value="half-board">{tr("Half board", "نصف إقامة")}</option>
                <option value="no-meals">{tr("Accommodation without meals", "إقامة بدون وجبات")}</option>
                <option value="company-bnb">{tr("Company bed and breakfast", "إقامة ومبيت وإفطار على نفقة الشركة")}</option>
                <option value="employee-arranged">{tr("Accommodation paid by employee", "إقامة على نفقة الموظف")}</option>
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

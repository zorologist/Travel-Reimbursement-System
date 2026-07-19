import React, { useState } from 'react';
import { TravelRequestData } from '../services/requestApi';
import { useRequests } from '../hooks/useRequest';

export default function NewRequestPage() {
  const { addRequest, loading, error } = useRequests();

  // إدارة الحالات المدخلة من الواجهة (تم إرجاع القيمة الافتراضية لمنع إيرور الـ TypeScript)
  const [form, setForm] = useState({
    travelFrom: '',
    travelTo: '',
    startDate: '',
    startTime: '08:00', 
    endDate: '',
    returnTime: '',
    transport: 'سيارة الشركة',
    ticketAmount: '',
    accommodation: 'إقامة كاملة (Full Board)',
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const departureIso = new Date(`${form.startDate}T${form.startTime}`).toISOString();
    const returnIso = new Date(`${form.endDate}T${form.returnTime}`).toISOString();

    const requestData: TravelRequestData = {
      travelFrom: form.travelFrom,
      travelTo: form.travelTo,
      departureAt: departureIso,
      returnAt: returnIso,
      transport: form.transport,
      accommodation: form.accommodation,
      notes: form.notes,
      ticketAmount: (form.transport !== 'سيارة الشركة' && form.ticketAmount) ? Number(form.ticketAmount) : undefined
    };

    try {
      await addRequest(requestData);
      alert('تم إرسال طلب السفر بنجاح!');
    } catch (err) {
      console.error('حدث خطأ أثناء الإرسال:', err);
    }
  };

  const isPersonalTransport = form.transport !== 'سيارة الشركة';

  // قائمة المحافظات المتوافقة مع الفيديو
  const governorates = [
    "القاهرة", "الإسكندرية", "الجيزة", "السويس", "الإسماعيلية", 
    "بورسعيد", "دمياط", "الدقهلية", "الشرقية", "القليوبية", 
    "كفر الشيخ", "الغربية", "المنوفية", "البحيرة", "الفيوم", 
    "بني سويف", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان"
  ];

  return (
    <div className="max-w-4xl mx-auto my-8 p-8 bg-white rounded-2xl shadow-sm border border-gray-100" dir="rtl">
      
      {/* الكارت الأخضر العلوي المميز للفيديو */}
      <div className="bg-[#1E5A34] text-white p-6 rounded-xl mb-8 relative overflow-hidden">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold">تقديم طلب سفر جديد</h2>
          <span className="bg-white/20 text-xs px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
            قيد الإعداد
          </span>
        </div>
        <p className="text-emerald-100/80 text-sm">يرجى ملء البيانات أدناه لإرسال الطلب للمراجعة</p>
      </div>

      {/* عرض الأخطاء إن وجدت */}
      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 border border-red-100 rounded-xl text-sm">
          {error === 'CONFLICT' && 'تنبيه: هناك تعارض في تواريخ الطلب مع مأمورية أخرى.'}
          {error === 'FORBIDDEN' && 'عذراً، ليس لديك الصلاحية لإتمام هذا الإجراء.'}
          {error === 'SERVER_ERROR' && 'حدث خطأ في الاتصال بالخادم، يرجى المحاولة لاحقاً.'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* القسم الأول: مسار الرحلة */}
        <fieldset className="border-t border-gray-200 pt-4">
          <legend className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-2">مسار الرحلة</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">السفر من</label>
              <select name="travelFrom" value={form.travelFrom} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all" required>
                <option value="">مدينة الانطلاق</option>
                {governorates.map((gov) => <option key={gov} value={gov}>{gov}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">السفر إلى (الوجهة)</label>
              <select name="travelTo" value={form.travelTo} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all" required>
                <option value="">اختر مدينة الوجهة</option>
                {governorates.map((gov) => <option key={gov} value={gov}>{gov}</option>)}
              </select>
            </div>
          </div>
        </fieldset>

        {/* القسم الثاني: المواعيد والتواريخ */}
        <fieldset className="border-t border-gray-200 pt-4">
          <legend className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-2">Mواعيد والتواريخ</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الذهاب</label>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ العودة</label>
              <input type="date" name="endDate" value={form.endDate} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ساعة العودة</label>
              <input type="time" name="returnTime" value={form.returnTime} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all" required />
            </div>
          </div>
        </fieldset>

        {/* القسم الثالث: وسيلة الانتقال والتكاليف */}
        <fieldset className="border-t border-gray-200 pt-4">
          <legend className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-2">وسيلة الانتقال والتكاليف</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">وسيلة الانتقال</label>
              <select name="transport" value={form.transport} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all">
                <option value="سيارة الشركة">سيارة الشركة</option>
                <option value="سيارة خاصة (شخصية)">سيارة خاصة (شخصية)</option>
                <option value="وسيلة أخرى غير تابعة للشركة">وسيلة أخرى غير تابعة للشركة</option>
              </select>
            </div>
            
            {isPersonalTransport && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ المدفوع (جنيه)</label>
                <div className="relative">
                  <input type="number" name="ticketAmount" value={form.ticketAmount} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all pl-12" placeholder="أدخل المبلغ المدفوع" required />
                  <span className="absolute left-3 top-3 text-sm text-gray-400 font-medium">EGP</span>
                </div>
                <p className="text-amber-600 text-xs mt-1.5">💡 المبلغ مطلوب لإرسال النقدية أو القيمة التابعة للشركة</p>
              </div>
            )}
          </div>
        </fieldset>

        {/* القسم الرابع: المستندات والمرفقات */}
        {isPersonalTransport && (
          <fieldset className="border-t border-gray-200 pt-4 animate-fadeIn">
            <legend className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-2">المستندات والمرفقات</legend>
            <div className="border-2 border-dashed border-gray-200 hover:border-[#1E5A34] bg-gray-50/30 rounded-xl p-6 text-center cursor-pointer transition-colors group">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="p-3 bg-emerald-50 rounded-full text-[#1E5A34] group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700">رافق تذكرة السفر أو الإيصال</p>
                <p className="text-xs text-gray-400">اضغط هنا أو اسحب الملف لرفعه (PNG, JPG, PDF)</p>
              </div>
              <input type="file" accept="image/*,.pdf" className="hidden" id="file-upload" />
            </div>
          </fieldset>
        )}

        {/* القسم الخامس: الإقامة والتوجيهات */}
        <fieldset className="border-t border-gray-200 pt-4">
          <legend className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-2">الإقامة والتوجيهات</legend>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع الإقامة</label>
              <select name="accommodation" value={form.accommodation} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all">
                <option value="إقامة كاملة (Full Board)">إقامة كاملة (Full Board)</option>
                <option value="نصف إقامة (Half Board)">نصف إقامة (Half Board)</option>
                <option value="بدون وجبات">بدون وجبات</option>
                <option value="By the company B&B">By the company B&B</option>
                <option value="إقامة على نفقة الموظف (Accommodation by Employee)">إقامة على نفقة الموظف (Accommodation by Employee)</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* القسم السادس: الملاحظات */}
        <fieldset className="border-t border-gray-200 pt-4">
          <legend className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-2">الملاحظات</legend>
          <div>
            <textarea name="notes" rows={4} value={form.notes} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 p-3 rounded-lg text-gray-800 focus:bg-white focus:border-[#1E5A34] focus:outline-none transition-all resize-none" placeholder="اكتب أي ملاحظات أو تفاصيل إضافية هنا..."></textarea>
          </div>
        </fieldset>

        {/* زر الإرسال */}
        <button type="submit" disabled={loading} className="w-full bg-[#1E5A34] text-white p-4 rounded-xl font-bold text-base shadow-sm hover:bg-[#153f24] active:scale-[0.99] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all mt-4">
          {loading ? 'جاري إرسال الطلب...' : 'إرسال الطلب للاعتماد'}
        </button>
      </form>
    </div>
  );
}
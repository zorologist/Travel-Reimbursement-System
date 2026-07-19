import React, { useState } from 'react';
import { useRequests } from '../hooks/useRequest';


export default function MyRequestsPage() {
  const { requests, loading, error } = useRequests();
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed' | 'cancelled'>('all');

  // تصفية الطلبات بناءً على حالة الزر النشط (Filters)
  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  if (loading) return <div className="text-center py-10">جاري تحميل مأمورياتك الحالية...</div>;
  if (error) return <div className="text-center py-10 text-red-600">فشل في جلب البيانات من السيرفر.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6" dir="rtl">
      <h2 className="text-2xl font-bold mb-6">سجل طلبات السفر والمأموريات</h2>

      {/* أزرار الفلترة المذكورة في التكليفات */}
      <div className="flex gap-2 mb-6 border-b pb-3">
        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm ${filter === 'all' ? 'bg-[#1E5A34] text-white' : 'bg-gray-100 text-gray-700'}`}>الكل</button>
        <button onClick={() => setFilter('in-progress')} className={`px-4 py-2 rounded-lg text-sm ${filter === 'in-progress' ? 'bg-[#1E5A34] text-white' : 'bg-gray-100 text-gray-700'}`}>قيد التنفيذ (In-Progress)</button>
        <button onClick={() => setFilter('completed')} className={`px-4 py-2 rounded-lg text-sm ${filter === 'completed' ? 'bg-[#1E5A34] text-white' : 'bg-gray-100 text-gray-700'}`}>المكتملة (Completed)</button>
        <button onClick={() => setFilter('cancelled')} className={`px-4 py-2 rounded-lg text-sm ${filter === 'cancelled' ? 'bg-[#1E5A34] text-white' : 'bg-gray-100 text-gray-700'}`}>الملغاة (Cancelled)</button>
      </div>

      {/* قائمة الطلبات (Empty / Data lists rendering) */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 text-gray-400 border border-dashed rounded-xl bg-gray-50">لا يوجد طلبات تطابق هذا الفلتر حالياً.</div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <div key={req.id} className="p-5 bg-white border rounded-xl shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-gray-800">مأمورية إلى: {req.travelTo}</h3>
                <p className="text-xs text-gray-500 mt-1">من: {req.travelFrom} | انطلاق: {new Date(req.departureAt).toLocaleDateString('ar-EG')}</p>
                
                {/* إظهار سبب الإلغاء فقط لو كانت المأمورية ملغاة كما طلبت المهمة */}
                {req.status === 'cancelled' && req.cancellationReason && (
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded mt-2 font-medium">سبب الإلغاء: {req.cancellationReason}</p>
                )}
              </div>

              <div className="text-left">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  req.status === 'completed' ? 'bg-green-100 text-green-800' :
                  req.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {req.status === 'completed' ? 'مكتملة' : req.status === 'cancelled' ? 'ملغاة' : 'قيد المراجعة'}
                </span>

                {/* حظر ظهور السعر المالي أو تعديلات الراتب إلا بعد الاكتمال التام للطلب */}
                {req.status === 'completed' && req.finalPrice ? (
                  <div className="text-sm font-bold text-[#1E5A34] mt-2">المبلغ المعتمد: {req.finalPrice} جنيه</div>
                ) : (
                  <div className="text-xs text-gray-400 mt-2 italic">* الحسابات المالية تظهر بعد الاعتماد والاقفال</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}// will use this page to find and review all travel requests they have submitted.

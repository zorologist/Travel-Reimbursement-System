import React, { useState } from 'react';
import { useRequests } from '../hooks/useRequest';
import { RequestList } from '../components/requests/RequestList';


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

      <RequestList requests={filteredRequests} />
    </div>
  );
}// will use this page to find and review all travel requests they have submitted.

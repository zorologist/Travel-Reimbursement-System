<<<<<<< HEAD
// تعريف واجهة البيانات الصادرة للـ API بناءً على الشروط المطلوبة
export interface TravelRequestData {
  travelFrom: string;       // الـ origin المطلوب تفعيله
  travelTo: string;         // الوجهة
  departureAt: string;      // دمج التاريخ والوقت بصيغة ISO
  returnAt: string;         // دمج تاريخ ووقت العودة بصيغة ISO
  transport: string;        // وسيلة الانتقال
  ticketAmount?: number;    // حقل المبلغ المدفوع المشروط
  receiptUrl?: string;      // رابط إيصال الرفع المشروط
  accommodation: string;    // نوع الإقامة (بما فيها على نفقة الموظف)
  notes: string;            // حقل الملاحظات البديل لـ comment
}

export interface RequestResponse extends TravelRequestData {
  id: string;
  status: 'in-progress' | 'completed' | 'cancelled';
  cancellationReason?: string;
  finalPrice?: number;
  createdAt: string;
}

// محاكاة استدعاء الـ API (يمكنك ربطها بـ Axios أو Fetch لاحقاً مع الـ Backend)
export const requestApi = {
  // 1. إرسال طلب جديد POST /api/requests
  createRequest: async (data: TravelRequestData): Promise<RequestResponse> => {
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      if (response.status === 403) throw new Error('FORBIDDEN');
      if (response.status === 409) throw new Error('CONFLICT');
      throw new Error('SERVER_ERROR');
    }
    return response.json();
  },

  // 2. جلب طلبات الموظف الحالي GET /api/requests
  getMyRequests: async (): Promise<RequestResponse[]> => {
    const response = await fetch('/api/requests');
    if (!response.ok) throw new Error('SERVER_ERROR');
    return response.json();
  }
};
=======

>>>>>>> 5dbe00b3608914a34a607d8eba7d15fbdcbdf0f6

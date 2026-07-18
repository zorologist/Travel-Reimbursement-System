// Employees use this React page to prepare a new travel request before API integration is available.
import { useState, type FormEvent } from "react";
import "../styles/newRequest.css";

type TransportationMethod = "company" | "personal" | "other";

export function NewRequestPage() {
  const [transportationMethod, setTransportationMethod] =
    useState<TransportationMethod>("company");
  const [submitted, setSubmitted] = useState(false);

  const needsTransportationProof = transportationMethod === "other";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const requestData = Object.fromEntries(formData.entries());

    // Replace this development log with the request API call when that endpoint is ready.
    console.info("Travel request prepared for API integration:", requestData);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="new-request-page" lang="ar" dir="rtl">
      <nav className="request-navbar" aria-label="التنقل الرئيسي">
        <div className="request-nav-container">
          <div className="request-brand-section">
            <div className="request-logo-box" aria-hidden="true">
              E
            </div>
            <div className="request-brand-text">
              <span className="request-brand-title">إيجاس — EGAS</span>
              <span className="request-brand-subtitle">
                الشركة المصرية القابضة للغازات الطبيعية
              </span>
            </div>
          </div>

          <div className="request-user-profile">
            <span className="request-avatar" aria-hidden="true">
              👤
            </span>
            <span className="request-user-role">بوابة الموظف</span>
          </div>
        </div>
      </nav>

      <main className="request-main-content">
        {submitted && (
          <div className="request-success" role="status">
            تم تجهيز طلب السفر بنجاح. سيتم إرساله للمراجعة بعد ربط واجهة
            النظام بالخادم.
          </div>
        )}

        <section className="request-form-card" aria-labelledby="request-title">
          <div className="request-card-line" />

          <div className="request-card-body">
            <header className="request-form-header">
              <h1 id="request-title">⇄ تقديم طلب سفر جديد</h1>
              <p>
                يرجى ملء البيانات أدناه بدقة لإرسال الطلب تلقائياً إلى مراحل
                المراجعة والاعتماد.
              </p>
            </header>

            <form onSubmit={handleSubmit}>
              <div className="request-form-grid request-grid-two">
                <div className="request-form-group">
                  <label htmlFor="travelFrom">السفر من</label>
                  <input
                    id="travelFrom"
                    type="text"
                    name="travelFrom"
                    placeholder="مدينة الانطلاق (مثال: القاهرة)"
                    required
                  />
                </div>

                <div className="request-form-group">
                  <label htmlFor="destinationCity">السفر إلى (الوجهة)</label>
                  <input
                    id="destinationCity"
                    type="text"
                    name="destinationCity"
                    placeholder="مدينة الوجهة (مثال: الإسكندرية)"
                    required
                  />
                </div>
              </div>

              <div className="request-form-grid request-grid-three">
                <div className="request-form-group">
                  <label htmlFor="departureDate">📅 تاريخ الذهاب</label>
                  <input
                    id="departureDate"
                    type="date"
                    name="departureDate"
                    required
                  />
                </div>

                <div className="request-form-group">
                  <label htmlFor="returnDate">📅 تاريخ العودة</label>
                  <input
                    id="returnDate"
                    type="date"
                    name="returnDate"
                    required
                  />
                </div>

                <div className="request-form-group">
                  <label htmlFor="returnTime">🕒 ساعة العودة</label>
                  <input
                    id="returnTime"
                    type="time"
                    name="returnTime"
                    required
                  />
                </div>
              </div>

              <div
                className={`request-form-grid ${
                  needsTransportationProof
                    ? "request-grid-two"
                    : "request-grid-one"
                }`}
              >
                <div className="request-form-group">
                  <label htmlFor="transportationMethod">🚗 وسيلة الانتقال</label>
                  <select
                    id="transportationMethod"
                    name="transportationMethod"
                    value={transportationMethod}
                    onChange={(event) => {
                      setTransportationMethod(
                        event.target.value as TransportationMethod,
                      );
                      setSubmitted(false);
                    }}
                  >
                    <option value="company">سيارة الشركة</option>
                    <option value="personal">سيارة خاصة (شخصية)</option>
                    <option value="other">
                      وسيلة أخرى غير تابعة للشركة
                    </option>
                  </select>
                </div>

                {needsTransportationProof && (
                  <div className="request-form-group request-fade-in">
                    <label htmlFor="ticketAmount">
                      المبلغ المدفوع (بالجنيه)
                    </label>
                    <input
                      id="ticketAmount"
                      type="number"
                      name="ticketAmount"
                      min="0"
                      step="0.01"
                      placeholder="أدخل قيمة التذكرة أو التكلفة"
                      required
                    />
                  </div>
                )}
              </div>

              {needsTransportationProof && (
                <div className="request-form-group request-fade-in">
                  <label htmlFor="transportationReceipt">
                    إرفاق تذكرة السفر أو الإيصال
                  </label>
                  <label
                    className="request-upload-zone"
                    htmlFor="transportationReceipt"
                  >
                    <span className="request-upload-icon" aria-hidden="true">
                      ☁️
                    </span>
                    <span className="request-upload-text">
                      اضغط هنا لاختيار الملف
                    </span>
                    <span className="request-upload-hint">
                      يُقبل امتداد PNG أو JPG بصورة واضحة لإثبات التكلفة
                    </span>
                    <input
                      id="transportationReceipt"
                      type="file"
                      name="transportationReceipt"
                      accept="image/png,image/jpeg"
                      className="request-file-input"
                      required
                    />
                  </label>
                </div>
              )}

              <div className="request-form-group">
                <label htmlFor="accommodationType">🏨 نوع الإقامة</label>
                <select
                  id="accommodationType"
                  name="accommodationType"
                  defaultValue="none"
                >
                  <option value="none">إقامة على نفقة الموظف</option>
                  <option value="room-only">غرفة مقدمة بدون طعام</option>
                  <option value="room-and-food">غرفة وطعام مقدمان</option>
                </select>
              </div>

              <div className="request-form-group">
                <label htmlFor="notes">📝 الملاحظات</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  placeholder="اكتب أي ملاحظات أو تفاصيل إضافية بشأن طبيعة المأمورية هنا..."
                />
              </div>

              <button type="submit" className="request-submit-button">
                إرسال الطلب للاعتماد
              </button>
            </form>
          </div>
        </section>

        <footer className="request-footer">
          حقوق الطبع والنشر © ٢٠٢٦ إيجاس (EGAS). جميع الحقوق محفوظة.
        </footer>
      </main>
    </div>
  );
}

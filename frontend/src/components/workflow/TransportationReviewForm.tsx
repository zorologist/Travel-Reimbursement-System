import { useState } from "react";

import { PriceComparison } from "../pricing/PriceComparison";
import { workflowApi, type ApprovalQueueItem } from "../../services/workflowApi";
import { useLanguage } from "../../hooks/useLanguage";
import { localizeLabel } from "../../i18n/format";
import { transportationOptions } from "../../constants/transportationOptions";

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function TransportationReviewForm({ request, onAction }: { request: ApprovalQueueItem; onAction: (action: () => Promise<void>) => Promise<void> }) {
  const { language, tr } = useLanguage();
  const details = request.requestDetails;
  const [destination, setDestination] = useState(details.destinationCity ?? "");
  const [method, setMethod] = useState(() => {
    const initial = details.transportationMethod ?? "";
    const match = transportationOptions.find((option) => option.value === initial || option.formValue === initial);
    return match ? match.value : transportationOptions[0].value;
  });
  const [comment, setComment] = useState("");
  const [selectedAttachment, setSelectedAttachment] = useState<ApprovalQueueItem["attachments"][number] | null>(null);

  return (
    <div className="transportation-review-form form-panel">
      <h3>{tr("Transportation Review", "مراجعة الانتقالات")}</h3>
      <section className="transport-attachments" aria-labelledby={`transport-attachments-${request.id}`}>
        <h4 id={`transport-attachments-${request.id}`}>{tr("Travel attachments", "مرفقات السفر")}</h4>
        {request.attachments.length === 0 ? (
          <p className="attachment-empty">{tr("No attachment was submitted with this request.", "لم يتم إرسال أي مرفق مع هذا الطلب.")}</p>
        ) : (
          <ul>
            {request.attachments.map((attachment) => (
              <li key={attachment.id}>
                <div>
                  <strong>{attachment.name}</strong>
                  <small>{attachment.mimeType || tr("File", "ملف")} · {formatFileSize(attachment.size)}</small>
                </div>
                <button type="button" className="attachment-open-button" onClick={() => setSelectedAttachment(attachment)} aria-label={tr(`Open ${attachment.name}`, `فتح ${attachment.name}`)}>
                  {tr("Open attachment", "فتح المرفق")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {selectedAttachment && (
        <div className="attachment-preview-backdrop" role="dialog" aria-modal="true" aria-labelledby={`attachment-preview-${selectedAttachment.id}`}>
          <div className="attachment-preview">
            <header>
              <h4 id={`attachment-preview-${selectedAttachment.id}`}>{selectedAttachment.name}</h4>
              <button type="button" onClick={() => setSelectedAttachment(null)} aria-label={tr("Close attachment preview", "إغلاق معاينة المرفق")}>×</button>
            </header>
            <iframe src={selectedAttachment.url} title={tr(`Preview of ${selectedAttachment.name}`, `معاينة ${selectedAttachment.name}`)} sandbox="" />
            <a href={selectedAttachment.url} download={selectedAttachment.name}>{tr("Download attachment", "تنزيل المرفق")}</a>
          </div>
        </div>
      )}
      <div className="form-group">
        <label>{tr("Verified destination", "الوجهة المؤكدة")}</label>
        <input value={destination} onChange={(event) => setDestination(event.target.value)} />
      </div>
      <div className="form-group">
        <label>{tr("Transportation method", "وسيلة الانتقال")}</label>
        <select value={method} onChange={(event) => setMethod(event.target.value)}>
          {transportationOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {tr(option.english, option.arabic)}
            </option>
          ))}
        </select>
      </div>
      <p className="transport-cost-readonly" role="note">
        {tr("Transportation cost is no longer editable at this stage. It will be set by Payroll.", "تكلفة الانتقال لم تعد قابلة للتعديل في هذه المرحلة. سيتم تحديدها من قِبل قسم الرواتب.")}
      </p>
      <div className="form-group">
        <label htmlFor={`transport-comment-${request.id}`}>{tr("Transportation comment", "تعليق الانتقالات")}</label>
        <textarea id={`transport-comment-${request.id}`} rows={4} maxLength={1000} value={comment} onChange={(event) => setComment(event.target.value)} placeholder={tr("Add a review comment...", "أضف تعليق المراجعة...")} />
      </div>
      <button className="btn-approve" type="button" onClick={() => void onAction(() => workflowApi.approve(request.id, { destination, method, reason: comment.trim() || tr("Destination and method verified.", "تم التحقق من الوجهة ووسيلة الانتقال.") }))}>
        {tr("Approve & Pass to Timing", "اعتماد وتحويل إلى المواعيد")}
      </button>
    </div>
  );
}

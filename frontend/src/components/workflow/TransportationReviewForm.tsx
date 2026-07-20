import { useState } from "react";

import { PriceComparison } from "../pricing/PriceComparison";
import { workflowApi, type ApprovalQueueItem } from "../../services/workflowApi";
import { useLanguage } from "../../hooks/useLanguage";
import { localizeLabel } from "../../i18n/format";

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function TransportationReviewForm({ request, onAction }: { request: ApprovalQueueItem; onAction: (action: () => Promise<void>) => Promise<void> }) {
  const { language, tr } = useLanguage();
  const details = request.requestDetails;
  const [destination, setDestination] = useState(details.destinationCity ?? "");
  const [method, setMethod] = useState(details.transportationMethod ?? "");
  const [transportationCost, setTransportationCost] = useState(details.transportationCost ?? 0);
  const [selectedAttachment, setSelectedAttachment] = useState<ApprovalQueueItem["attachments"][number] | null>(null);
  const previewTotal = request.currentPrice - (details.transportationCost ?? 0) + transportationCost;

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
          {method && !["Flight", "Train", "Company bus", "Company car", "Personal car"].includes(method) && <option>{localizeLabel(method, language)}</option>}
          <option value="">{tr("Select a method", "اختر وسيلة")}</option>
          {(["Flight", "Train", "Company bus", "Company car", "Personal car"] as const).map((value) => <option key={value} value={value}>{localizeLabel(value, language)}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>{tr("Confirmed transportation cost (EGP)", "تكلفة الانتقال المؤكدة (جنيه)")}</label>
        <input min="0" step="0.01" type="number" value={transportationCost} onChange={(event) => setTransportationCost(Number(event.target.value))} />
      </div>
      <PriceComparison originalPrice={request.currentPrice} newPrice={previewTotal} />
      <button className="btn-approve" type="button" onClick={() => void onAction(() => workflowApi.approve(request.id, { destination, method, transportationCost, reason: tr("Destination, method, and transport cost verified.", "تم التحقق من الوجهة ووسيلة الانتقال والتكلفة.") }))}>
        {tr("Approve & Pass to Timing", "اعتماد وتحويل إلى المواعيد")}
      </button>
    </div>
  );
}

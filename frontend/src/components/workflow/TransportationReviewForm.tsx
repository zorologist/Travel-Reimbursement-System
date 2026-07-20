import { useState } from "react";

import { PriceComparison } from "../pricing/PriceComparison";
import { workflowApi, type ApprovalQueueItem } from "../../services/workflowApi";

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function TransportationReviewForm({ request, onAction }: { request: ApprovalQueueItem; onAction: (action: () => Promise<void>) => Promise<void> }) {
  const details = request.requestDetails;
  const [destination, setDestination] = useState(details.destinationCity ?? "");
  const [method, setMethod] = useState(details.transportationMethod ?? "");
  const [transportationCost, setTransportationCost] = useState(details.transportationCost ?? 0);
  const [selectedAttachment, setSelectedAttachment] = useState<ApprovalQueueItem["attachments"][number] | null>(null);
  const previewTotal = request.currentPrice - (details.transportationCost ?? 0) + transportationCost;

  return (
    <div className="transportation-review-form form-panel">
      <h3>Transportation Review</h3>
      <section className="transport-attachments" aria-labelledby={`transport-attachments-${request.id}`}>
        <h4 id={`transport-attachments-${request.id}`}>Travel attachments</h4>
        {request.attachments.length === 0 ? (
          <p className="attachment-empty">No attachment was submitted with this request.</p>
        ) : (
          <ul>
            {request.attachments.map((attachment) => (
              <li key={attachment.id}>
                <div>
                  <strong>{attachment.name}</strong>
                  <small>{attachment.mimeType || "File"} · {formatFileSize(attachment.size)}</small>
                </div>
                <button type="button" className="attachment-open-button" onClick={() => setSelectedAttachment(attachment)} aria-label={`Open ${attachment.name}`}>
                  Open attachment
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
              <button type="button" onClick={() => setSelectedAttachment(null)} aria-label="Close attachment preview">×</button>
            </header>
            <iframe src={selectedAttachment.url} title={`Preview of ${selectedAttachment.name}`} sandbox="" />
            <a href={selectedAttachment.url} download={selectedAttachment.name}>Download attachment</a>
          </div>
        </div>
      )}
      <div className="form-group">
        <label>Verified destination</label>
        <input value={destination} onChange={(event) => setDestination(event.target.value)} />
      </div>
      <div className="form-group">
        <label>Transportation method</label>
        <select value={method} onChange={(event) => setMethod(event.target.value)}>
          {method && !["Flight", "Train", "Company bus", "Company car", "Personal car"].includes(method) && <option>{method}</option>}
          <option value="">Select a method</option>
          <option>Flight</option>
          <option>Train</option>
          <option>Company bus</option>
          <option>Company car</option>
          <option>Personal car</option>
        </select>
      </div>
      <div className="form-group">
        <label>Confirmed transportation cost (EGP)</label>
        <input min="0" step="0.01" type="number" value={transportationCost} onChange={(event) => setTransportationCost(Number(event.target.value))} />
      </div>
      <PriceComparison originalPrice={request.currentPrice} newPrice={previewTotal} />
      <button className="btn-approve" type="button" onClick={() => void onAction(() => workflowApi.approve(request.id, { destination, method, transportationCost, reason: "Destination, method, and transport cost verified." }))}>
        Approve &amp; Pass to Timing
      </button>
    </div>
  );
}

import React from 'react';
import type { PublicPriceRevision } from '../../services/requestApi';
import type { PriceRevision as WorkflowPriceRevision } from '../../services/workflowApi';
import { useLanguage } from '../../hooks/useLanguage';
import { formatCurrency, formatDate, localizeLabel } from '../../i18n/format';

/** Either of the two revision shapes the timeline needs to render: the
 *  department-facing `WorkflowPriceRevision` (used by DepartmentReviewPanel) or
 *  the public `PublicPriceRevision` (used by the employee-facing tracker). */
type AnyRevision = WorkflowPriceRevision | PublicPriceRevision;

function isPublicRevision(rev: AnyRevision): rev is PublicPriceRevision {
  return typeof (rev as PublicPriceRevision).previousAmount === "number";
}

function normalizeRevision(rev: AnyRevision): {
  id: string;
  stage: string;
  actorRole: string;
  previousAmount: number;
  newAmount: number;
  difference: number;
  note: string;
  createdAt: string;
} {
  if (isPublicRevision(rev)) {
    return {
      id: rev.id,
      stage: rev.stage,
      actorRole: rev.actorRole,
      previousAmount: rev.previousAmount,
      newAmount: rev.newAmount,
      difference: rev.difference,
      note: rev.note,
      createdAt: rev.createdAt,
    };
  }
  // WorkflowPriceRevision shape — department and previousPrice/newPrice.
  const difference = rev.newPrice - rev.previousPrice;
  return {
    id: rev.id,
    stage: rev.department,
    actorRole: rev.department,
    previousAmount: rev.previousPrice,
    newAmount: rev.newPrice,
    difference,
    note: rev.reason,
    createdAt: rev.updatedAt,
  };
}

interface Props {
  revisions: AnyRevision[];
}

/**
 * Section 8 — per-line-item visibility. Renders each price revision as its own
 * row (stage, actor role, before/after amount, note) instead of one aggregated
 * status. Used by both the employee-facing Request Details page (PublicPriceRevision
 * shape) and the department-review panel (WorkflowPriceRevision shape).
 */
export const PriceHistoryTimeline: React.FC<Props> = ({ revisions }) => {
  const { language, tr } = useLanguage();
  if (!revisions || revisions.length === 0) {
    return (
      <p className="price-history-empty">
        {tr("No price revisions have been recorded yet.", "لا توجد تعديلات سجلّت على المبلغ بعد.")}
      </p>
    );
  }
  const normalized = revisions.map(normalizeRevision);
  return (
    <div className="price-history-timeline">
      {normalized.map((rev, index) => {
        const positive = rev.difference >= 0;
        return (
          <div key={rev.id || index} className="timeline-item">
            <div className="timeline-marker" data-direction={positive ? 'up' : 'down'} aria-hidden="true" />
            <div className="timeline-content">
              <h4>
                {tr(`${localizeLabel(rev.stage, language)} · ${localizeLabel(rev.actorRole, language)}`,
                    `${localizeLabel(rev.stage, language)} · ${localizeLabel(rev.actorRole, language)}`)}
              </h4>
              <p className="price-shift">
                <span className="price-from">{formatCurrency(rev.previousAmount, language)}</span>
                <span className="price-arrow" aria-hidden="true">→</span>
                <span className="price-to">{formatCurrency(rev.newAmount, language)}</span>
                <span className={`price-delta ${positive ? 'price-delta--up' : 'price-delta--down'}`}>
                  {positive ? '+' : ''}{formatCurrency(rev.difference, language)}
                </span>
              </p>
              {rev.note && <p className="reason">"{rev.note}"</p>}
              <span className="timestamp">{formatDate(rev.createdAt, language)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

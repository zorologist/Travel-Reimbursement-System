import React from 'react';
import { PriceRevision } from '../../services/workflowApi';
import { useLanguage } from '../../hooks/useLanguage';
import { formatCurrency, formatDate, localizeLabel } from '../../i18n/format';

interface Props {
  revisions: PriceRevision[];
}

export const PriceHistoryTimeline: React.FC<Props> = ({ revisions }) => {
  const { language, tr } = useLanguage();
  return (
    <div className="price-history-timeline">
      {revisions.map((rev, index) => (
        <div key={rev.id || index} className="timeline-item">
          <div className="timeline-marker"></div>
          <div className="timeline-content">
            <h4>{tr(`${localizeLabel(rev.department, language)} Revision`, `تعديل ${localizeLabel(rev.department, language)}`)}</h4>
            <p className="price-shift">
              {formatCurrency(rev.previousPrice, language)} &rarr; {formatCurrency(rev.newPrice, language)}
            </p>
            {rev.reason && <p className="reason">"{rev.reason}"</p>}
            <span className="timestamp">{formatDate(rev.updatedAt, language)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

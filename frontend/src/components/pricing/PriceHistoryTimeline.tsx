import React from 'react';
import { PriceRevision } from '../../services/workflowApi';

interface Props {
  revisions: PriceRevision[];
}

export const PriceHistoryTimeline: React.FC<Props> = ({ revisions }) => {
  return (
    <div className="price-history-timeline">
      {revisions.map((rev, index) => (
        <div key={rev.id || index} className="timeline-item">
          <div className="timeline-marker"></div>
          <div className="timeline-content">
            <h4>{rev.department} Revision</h4>
            <p className="price-shift">
              ${rev.previousPrice} &rarr; ${rev.newPrice}
            </p>
            {rev.reason && <p className="reason">"{rev.reason}"</p>}
            <span className="timestamp">{new Date(rev.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

import React, { useState } from 'react';
import { ApprovalQueueItem, workflowApi } from '../../services/workflowApi';
import { PriceComparison } from '../pricing/PriceComparison';

interface Props {
  request: ApprovalQueueItem;
  onAction: (actionFn: () => Promise<void>) => Promise<void>;
}

export const TimingReviewForm: React.FC<Props> = ({ request, onAction }) => {
  const [departureAt, setDepartureAt] = useState(request.requestDetails?.departureAt || '');
  const [returnAt, setReturnAt] = useState(request.requestDetails?.returnAt || '');
  const [timingCost, setTimingCost] = useState(request.currentPrice);
  const [meetsSevenHourRule, setMeetsSevenHourRule] = useState(true);

  const handleApprove = () => {
    onAction(() => workflowApi.approve(request.id, { 
      department: 'TIMING',
      revisedCost: timingCost,
      departureAt,
      returnAt,
      meetsSevenHourRule
    }));
  };

  // Helper to convert ISO string to datetime-local format for the input
  const formatForInput = (isoString: string) => {
    if (!isoString) return '';
    return new Date(isoString).toISOString().slice(0, 16);
  };

  return (
    <div className="timing-review-form form-panel">
      <h3>Timing & Hours Review</h3>
      
      <div className="form-group">
        <label>Verified Departure Time</label>
        <input 
          type="datetime-local" 
          value={formatForInput(departureAt)} 
          onChange={(e) => setDepartureAt(new Date(e.target.value).toISOString())}
        />
      </div>

      <div className="form-group">
        <label>Verified Return Time</label>
        <input 
          type="datetime-local" 
          value={formatForInput(returnAt)} 
          onChange={(e) => setReturnAt(new Date(e.target.value).toISOString())}
        />
      </div>

      <div className="form-group checkbox-group" style={{ margin: '16px 0' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="checkbox" 
            checked={meetsSevenHourRule}
            onChange={(e) => setMeetsSevenHourRule(e.target.checked)}
          />
          <strong>Meets 7-Hour Minimum Result Requirement</strong>
        </label>
      </div>

      <div className="form-group">
        <label>Revised Total Request Cost ($)</label>
        <input 
          type="number" 
          value={timingCost} 
          onChange={(e) => setTimingCost(Number(e.target.value))}
        />
      </div>

      <PriceComparison 
        originalPrice={request.currentPrice} 
        newPrice={timingCost} 
      />

      <button className="btn-approve" onClick={handleApprove}>
        Approve Timing & Forward Request
      </button>
    </div>
  );
};

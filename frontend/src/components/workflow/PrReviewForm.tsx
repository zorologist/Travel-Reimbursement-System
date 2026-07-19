import React, { useState } from 'react';
import { ApprovalQueueItem, workflowApi } from '../../services/workflowApi';
import { PriceComparison } from '../pricing/PriceComparison';

interface Props {
  request: ApprovalQueueItem;
  onAction: (actionFn: () => Promise<void>) => Promise<void>;
}

export const PrReviewForm: React.FC<Props> = ({ request, onAction }) => {
  const [accommodationCost, setAccommodationCost] = useState(request.currentPrice);

  const handleApprove = () => {
    onAction(() => workflowApi.approve(request.id, { 
      revisedCost: accommodationCost,
      department: 'PR'
    }));
  };

  return (
    <div className="pr-review-form form-panel">
      <h3>PR & Accommodation Review</h3>
      
      <div className="form-group">
        <label>Revised Accommodation Cost ($)</label>
        <input 
          type="number" 
          value={accommodationCost} 
          onChange={(e) => setAccommodationCost(Number(e.target.value))}
        />
      </div>

      <PriceComparison 
        originalPrice={request.currentPrice} 
        newPrice={accommodationCost} 
      />

      <button className="btn-approve" onClick={handleApprove}>
        Approve & Pass to Next Department
      </button>
    </div>
  );
};

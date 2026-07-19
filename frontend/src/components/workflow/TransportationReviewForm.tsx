import React, { useState } from 'react';
import { ApprovalQueueItem, workflowApi } from '../../services/workflowApi';
import { PriceComparison } from '../pricing/PriceComparison';

interface Props {
  request: ApprovalQueueItem;
  onAction: (actionFn: () => Promise<void>) => Promise<void>;
}

export const TransportationReviewForm: React.FC<Props> = ({ request, onAction }) => {
  // Fallback to empty strings if requestDetails hasn't been fully populated yet
  const [destination, setDestination] = useState(request.requestDetails?.destination || '');
  const [method, setMethod] = useState(request.requestDetails?.method || '');
  const [transportationCost, setTransportationCost] = useState(request.currentPrice);

  const handleApprove = () => {
    onAction(() => workflowApi.approve(request.id, { 
      department: 'TRANSPORTATION',
      revisedCost: transportationCost,
      destination,
      method
    }));
  };

  return (
    <div className="transportation-review-form form-panel">
      <h3>Transportation Review</h3>
      
      <div className="form-group">
        <label>Verified Destination</label>
        <input 
          type="text" 
          value={destination} 
          onChange={(e) => setDestination(e.target.value)}
          placeholder="e.g., Regional Office"
        />
      </div>

      <div className="form-group">
        <label>Transportation Method</label>
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="">Select Approved Method...</option>
          <option value="FLIGHT">Flight</option>
          <option value="TRAIN">Train</option>
          <option value="BUS">Bus</option>
          <option value="COMPANY_CAR">Company Car</option>
        </select>
      </div>

      <div className="form-group">
        <label>Revised Total Request Cost ($)</label>
        <input 
          type="number" 
          value={transportationCost} 
          onChange={(e) => setTransportationCost(Number(e.target.value))}
        />
      </div>

      <PriceComparison 
        originalPrice={request.currentPrice} 
        newPrice={transportationCost} 
      />

      <button className="btn-approve" onClick={handleApprove}>
        Approve & Pass to Next Department
      </button>
    </div>
  );
};

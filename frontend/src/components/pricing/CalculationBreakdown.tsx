import React from 'react';

interface CalculationDetails {
  baseAllowance: number;
  accommodationCost: number;
  transportationCost: number;
  timingAdjustments: number;
  bonuses?: number;
  penalties?: number;
  total: number;
}

interface Props {
  details: CalculationDetails;
}

export const CalculationBreakdown: React.FC<Props> = ({ details }) => {
  return (
    <div className="calculation-breakdown">
      <h4>System Calculation Breakdown</h4>
      <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0' }}>
        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
          <span>Base Allowance</span>
          <span>{details.baseAllowance.toFixed(2)} EGP</span>
        </li>
        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
          <span>Accommodation (PR)</span>
          <span>{details.accommodationCost.toFixed(2)} EGP</span>
        </li>
        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
          <span>Transportation</span>
          <span>{details.transportationCost.toFixed(2)} EGP</span>
        </li>
        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
          <span>Timing Adjustments</span>
          <span>{details.timingAdjustments.toFixed(2)} EGP</span>
        </li>
        
        {details.bonuses !== undefined && (
          <li style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#10b981' }}>
            <span>Bonuses</span>
            <span>+{details.bonuses.toFixed(2)} EGP</span>
          </li>
        )}
        
        {details.penalties !== undefined && (
          <li style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#ef4444' }}>
            <span>Penalties</span>
            <span>-{details.penalties.toFixed(2)} EGP</span>
          </li>
        )}
        
        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', marginTop: '8px', borderTop: '2px solid #e2e8f0', fontWeight: 'bold' }}>
          <span>Calculated Total</span>
          <span>{details.total.toFixed(2)} EGP</span>
        </li>
      </ul>
    </div>
  );
};

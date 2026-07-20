import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { formatCurrency } from '../../i18n/format';

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
  const { language, tr } = useLanguage();
  return (
    <div className="calculation-breakdown">
      <h4>{tr("System Calculation Breakdown", "تفاصيل حساب النظام")}</h4>
      <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0' }}>
        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
          <span>{tr("Base Allowance", "البدل الأساسي")}</span>
          <span>{formatCurrency(details.baseAllowance, language)}</span>
        </li>
        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
          <span>{tr("Accommodation (PR)", "الإقامة (العلاقات العامة)")}</span>
          <span>{formatCurrency(details.accommodationCost, language)}</span>
        </li>
        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
          <span>{tr("Transportation", "الانتقالات")}</span>
          <span>{formatCurrency(details.transportationCost, language)}</span>
        </li>
        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
          <span>{tr("Timing Adjustments", "تعديلات المواعيد")}</span>
          <span>{formatCurrency(details.timingAdjustments, language)}</span>
        </li>
        
        {details.bonuses !== undefined && (
          <li style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#10b981' }}>
            <span>{tr("Bonuses", "المكافآت")}</span>
            <span>+{formatCurrency(details.bonuses, language)}</span>
          </li>
        )}
        
        {details.penalties !== undefined && (
          <li style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#ef4444' }}>
            <span>{tr("Penalties", "الخصومات")}</span>
            <span>-{formatCurrency(details.penalties, language)}</span>
          </li>
        )}
        
        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', marginTop: '8px', borderTop: '2px solid #e2e8f0', fontWeight: 'bold' }}>
          <span>{tr("Calculated Total", "الإجمالي المحسوب")}</span>
          <span>{formatCurrency(details.total, language)}</span>
        </li>
      </ul>
    </div>
  );
};

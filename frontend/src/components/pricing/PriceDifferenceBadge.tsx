import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { formatCurrency } from '../../i18n/format';

interface Props {
  difference: number;
}

export const PriceDifferenceBadge: React.FC<Props> = ({ difference }) => {
  const { language, tr } = useLanguage();
  const isIncrease = difference > 0;
  const isDecrease = difference < 0;

  let backgroundColor = '#f1f5f9'; // Slate 100
  let color = '#475569'; // Slate 600
  let displayValue = tr('No Change', 'لا يوجد تغيير');

  if (isIncrease) {
    backgroundColor = '#fef2f2'; // Red 50
    color = '#ef4444'; // Red 500
    displayValue = `+${formatCurrency(difference, language)}`;
  } else if (isDecrease) {
    backgroundColor = '#ecfdf5'; // Emerald 50
    color = '#10b981'; // Emerald 500
    displayValue = `-${formatCurrency(Math.abs(difference), language)}`;
  }

  return (
    <div 
      className="price-difference-badge" 
      style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '9999px',
        backgroundColor,
        color,
        fontWeight: 600,
        fontSize: '0.875rem'
      }}
    >
      {displayValue}
    </div>
  );
};

import React from 'react';
import { PriceDifferenceBadge } from './PriceDifferenceBadge';
import { useLanguage } from '../../hooks/useLanguage';
import { formatCurrency } from '../../i18n/format';

interface Props {
  originalPrice: number;
  newPrice: number;
}

export const PriceComparison: React.FC<Props> = ({ originalPrice, newPrice }) => {
  const { language, tr } = useLanguage();
  const difference = newPrice - originalPrice;

  return (
    <div className="price-comparison">
      <div className="price-metrics">
        <div className="metric">
          <span className="label">{tr("Incoming Price", "المبلغ الوارد")}</span>
        <span className="value">{formatCurrency(originalPrice, language)}</span>
        </div>
        <div className="metric">
          <span className="label">{tr("Your Revised Price", "المبلغ بعد التعديل")}</span>
        <span className="value">{formatCurrency(newPrice, language)}</span>
        </div>
      </div>
      <PriceDifferenceBadge difference={difference} />
    </div>
  );
};

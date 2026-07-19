import React from 'react';
import { PriceDifferenceBadge } from './PriceDifferenceBadge';

interface Props {
  originalPrice: number;
  newPrice: number;
}

export const PriceComparison: React.FC<Props> = ({ originalPrice, newPrice }) => {
  const difference = newPrice - originalPrice;

  return (
    <div className="price-comparison">
      <div className="price-metrics">
        <div className="metric">
          <span className="label">Incoming Price</span>
          <span className="value">${originalPrice.toFixed(2)}</span>
        </div>
        <div className="metric">
          <span className="label">Your Revised Price</span>
          <span className="value">${newPrice.toFixed(2)}</span>
        </div>
      </div>
      <PriceDifferenceBadge difference={difference} />
    </div>
  );
};

import React from 'react';
import { DivideIcon as LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import Card from '../../../components/Card';
import './KPITiles.css';

interface KPIItem {
  title: string;
  value: number;
  icon: LucideIcon;
  color: 'primary' | 'accent' | 'success' | 'warning';
  change: string;
  isPositive: boolean;
}

interface KPITilesProps {
  items: KPIItem[];
}

const KPITiles: React.FC<KPITilesProps> = ({ items }) => {
  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="kpi-tiles">
      {items.map((item, index) => {
        const Icon = item.icon;
        const TrendIcon = item.isPositive ? TrendingUp : TrendingDown;
        
        return (
          <Card key={index} className={`kpi-tile kpi-tile--${item.color}`} interactive>
            <div className="tile-header">
              <div className="tile-icon">
                <Icon size={24} />
              </div>
              <div className="tile-change">
                <TrendIcon size={16} />
                <span>{item.change}</span>
              </div>
            </div>
            
            <div className="tile-content">
              <h3 className="tile-title">{item.title}</h3>
              <p className="tile-value">{formatValue(item.value)}</p>
            </div>

            <div className="tile-footer">
              <span className="tile-period">vs. last period</span>
            </div>

            {/* Animated background gradient */}
            <div className="tile-background" />
          </Card>
        );
      })}
    </div>
  );
};

export default KPITiles;
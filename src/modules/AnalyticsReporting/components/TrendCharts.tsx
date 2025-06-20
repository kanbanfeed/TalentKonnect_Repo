import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { TrendData } from '../../../types';
import Card from '../../../components/Card';
import './TrendCharts.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TrendChartsProps {
  data: TrendData;
}

const TrendCharts: React.FC<TrendChartsProps> = ({ data }) => {
  const createSparklineData = (values: number[], label: string, color: string) => ({
    labels: ['6 days ago', '5 days ago', '4 days ago', '3 days ago', '2 days ago', 'Yesterday', 'Today'],
    datasets: [
      {
        label: label,
        data: values,
        borderColor: color,
        backgroundColor: `${color}20`, // 20% opacity
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  });

  const sparklineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: false 
      },
      title: { 
        display: false 
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#333333',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            return context[0]?.label || '';
          },
          label: (context: any) => {
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: { 
        display: false,
        grid: {
          display: false,
        },
      },
      y: { 
        display: false,
        grid: {
          display: false,
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    elements: {
      line: {
        tension: 0.4,
      },
    },
  };

  const charts = [
    {
      title: 'Daily Credits',
      data: data.dailyCredits,
      color: '#E76F51',
      description: 'Credits earned by users daily',
    },
    {
      title: 'Active Users',
      data: data.activeUsers,
      color: '#1D3557',
      description: 'Users engaging with the platform',
    },
    {
      title: 'New Gigs',
      data: data.newGigs,
      color: '#2D7D32',
      description: 'New micro-tasks posted',
    },
    {
      title: 'Referrals',
      data: data.referrals,
      color: '#F57C00',
      description: 'New user referrals',
    },
  ];

  return (
    <div className="trend-charts">
      {charts.map((chart, index) => (
        <Card key={index} className="chart-card" interactive>
          <div className="chart-header">
            <div className="chart-info">
              <h3 className="chart-title">{chart.title}</h3>
              <p className="chart-description">{chart.description}</p>
            </div>
            <div className="chart-current-value">
              <span className="current-label">Current</span>
              <span className="current-value" style={{ color: chart.color }}>
                {chart.data[chart.data.length - 1]?.toLocaleString() || '0'}
              </span>
            </div>
          </div>
          
          <div className="chart-container">
            <Line 
              data={createSparklineData(chart.data, chart.title, chart.color)} 
              options={sparklineOptions} 
            />
          </div>

          <div className="chart-footer">
            <div className="trend-indicator">
              <span className="trend-label">7-day trend</span>
              <div className="trend-dots">
                {chart.data.map((value, idx) => {
                  const prevValue = idx > 0 ? chart.data[idx - 1] : value;
                  const isUp = value > prevValue;
                  const isDown = value < prevValue;
                  
                  return (
                    <div 
                      key={idx} 
                      className={`trend-dot ${isUp ? 'up' : isDown ? 'down' : 'neutral'}`}
                      style={{ backgroundColor: isUp ? '#2D7D32' : isDown ? '#D32F2F' : '#9E9E9E' }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default TrendCharts;
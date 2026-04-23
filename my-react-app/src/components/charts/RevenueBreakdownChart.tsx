import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DailyRevenue } from '../../services/admin-financial.service';
import './RevenueBreakdownChart.css';

interface RevenueBreakdownChartProps {
  data: DailyRevenue[];
  period: string;
}

const RevenueBreakdownChart: React.FC<RevenueBreakdownChartProps> = ({ data, period }) => {
  // Format currency for tooltips
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  // Format date for X-axis
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    
    // Show different formats based on period
    if (period === '7d') {
      return `${day}/${month}`;
    } else if (period === '30d') {
      return day % 5 === 0 ? `${day}/${month}` : '';
    } else if (period === '90d') {
      return day === 1 || day === 15 ? `${day}/${month}` : '';
    } else {
      return day === 1 ? `${month}/${date.getFullYear().toString().slice(2)}` : '';
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      const formattedDate = new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);

      return (
        <div className="revenue-chart-tooltip">
          <p className="tooltip-date">{formattedDate}</p>
          <div className="tooltip-items">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="tooltip-item" style={{ color: entry.color }}>
                <span className="tooltip-label">{entry.name}:</span>
                <span className="tooltip-value">{formatCurrency(entry.value)}</span>
              </div>
            ))}
            <div className="tooltip-item tooltip-total">
              <span className="tooltip-label">Tổng:</span>
              <span className="tooltip-value">
                {formatCurrency(
                  payload.reduce((sum: number, entry: any) => sum + entry.value, 0)
                )}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Transform data for chart
  const chartData = data.map((item) => ({
    date: item.date,
    'Nạp tiền': item.deposits,
    'Đăng ký': item.subscriptions,
    'Khóa học': item.courseSales,
  }));

  return (
    <div className="revenue-breakdown-chart">
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorSubscriptions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorCourses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value)}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
            iconType="circle"
          />
          <Area
            type="monotone"
            dataKey="Nạp tiền"
            stackId="1"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#colorDeposits)"
          />
          <Area
            type="monotone"
            dataKey="Đăng ký"
            stackId="1"
            stroke="#a855f7"
            strokeWidth={2}
            fill="url(#colorSubscriptions)"
          />
          <Area
            type="monotone"
            dataKey="Khóa học"
            stackId="1"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#colorCourses)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueBreakdownChart;

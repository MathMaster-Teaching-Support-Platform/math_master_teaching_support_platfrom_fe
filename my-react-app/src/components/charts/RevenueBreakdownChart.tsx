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

  interface TooltipPayloadEntry {
    name: string;
    value: number;
    color: string;
  }

  interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadEntry[];
    label?: string;
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const date = new Date(label!);
      const formattedDate = new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);

      return (
        <div style={{
          backgroundColor: '#faf9f5',
          padding: '1.25rem',
          borderRadius: '16px',
          border: '1px solid #e8e6dc',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
          minWidth: '200px'
        }}>
          <p style={{ margin: '0 0 1rem 0', fontWeight: 700, color: '#141413', fontSize: '0.9rem' }}>
            {formattedDate}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {payload.map((entry: TooltipPayloadEntry, index: number) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: '#5e5d59', fontSize: '0.85rem', fontWeight: 500 }}>{entry.name}:</span>
                <span style={{ color: entry.color, fontWeight: 700, fontSize: '0.9rem' }}>{formatCurrency(entry.value)}</span>
              </div>
            ))}
            <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #e8e6dc', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#141413', fontWeight: 700, fontSize: '0.9rem' }}>Tổng:</span>
              <span style={{ color: '#c96442', fontWeight: 800, fontSize: '0.95rem' }}>
                {formatCurrency(payload.reduce((sum: number, entry: TooltipPayloadEntry) => sum + entry.value, 0))}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const chartData = data.map((item) => ({
    date: item.date,
    'Nạp tiền': item.deposits,
    'Đăng ký': item.subscriptions,
    'Khóa học': item.courseSales,
  }));

  return (
    <div className="revenue-breakdown-chart" style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorSubscriptions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCourses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e6dc" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#87867f', fontSize: 12 }}
            dy={10}
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value)}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#87867f', fontSize: 12 }}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#c96442', strokeWidth: 1, strokeDasharray: '5 5' }} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '30px', fontSize: '12px', fontWeight: 600 }}
          />
          <Area
            type="monotone"
            dataKey="Nạp tiền"
            stackId="1"
            stroke="#3b82f6"
            strokeWidth={3}
            fill="url(#colorDeposits)"
            animationDuration={1500}
          />
          <Area
            type="monotone"
            dataKey="Đăng ký"
            stackId="1"
            stroke="#8b5cf6"
            strokeWidth={3}
            fill="url(#colorSubscriptions)"
            animationDuration={1800}
          />
          <Area
            type="monotone"
            dataKey="Khóa học"
            stackId="1"
            stroke="#10b981"
            strokeWidth={3}
            fill="url(#colorCourses)"
            animationDuration={2100}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueBreakdownChart;

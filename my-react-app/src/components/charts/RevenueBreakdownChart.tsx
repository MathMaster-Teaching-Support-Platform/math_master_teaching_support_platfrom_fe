import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
interface RevenueChartPoint {
  key: string;
  label: string;
  subscriptions: number;
  courseSales: number;
  total: number;
}

interface RevenueBreakdownChartProps {
  data: RevenueChartPoint[];
  groupBy: 'hour' | 'day' | 'month';
}

const RevenueBreakdownChart: React.FC<RevenueBreakdownChartProps> = ({ data, groupBy }) => {
  // Format currency for tooltips
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const parseKeyDate = (key: string): Date => {
    if (groupBy === 'month') return new Date(`${key}-01T00:00:00Z`);
    if (groupBy === 'hour') return new Date(`${key.replace(' ', 'T')}:00Z`);
    return new Date(`${key}T00:00:00Z`);
  };

  const formatTooltipLabel = (key: string): string => {
    const date = parseKeyDate(key);
    if (groupBy === 'hour') {
      return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    }
    if (groupBy === 'month') {
      return new Intl.DateTimeFormat('vi-VN', {
        month: 'long',
        year: 'numeric',
      }).format(date);
    }
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  interface TooltipPayloadEntry {
    name?: string;
    value?: number;
    color?: string;
    payload?: {
      key?: string;
    };
  }

  interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadEntry[];
    label?: string;
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const labelKey = payload[0]?.payload?.key ?? '';
      const formattedDate = labelKey ? formatTooltipLabel(labelKey) : '';

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
                <span style={{ color: entry.color, fontWeight: 700, fontSize: '0.9rem' }}>{formatCurrency(entry.value ?? 0)}</span>
              </div>
            ))}
            <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #e8e6dc', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#141413', fontWeight: 700, fontSize: '0.9rem' }}>Tổng:</span>
              <span style={{ color: '#c96442', fontWeight: 800, fontSize: '0.95rem' }}>
                {formatCurrency(payload.reduce((sum: number, entry: TooltipPayloadEntry) => sum + (entry.value ?? 0), 0))}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const chartData = data.map((item) => ({
    key: item.key,
    label: item.label,
    subscriptions: item.subscriptions,
    courseSales: item.courseSales,
  }));

  return (
    <div className="revenue-breakdown-chart" style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          barSize={24}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e6dc" />
          <XAxis
            dataKey="label"
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
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ fill: 'rgba(201, 100, 66, 0.05)' }} 
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '30px', fontSize: '12px', fontWeight: 600 }}
          />
          <Bar
            dataKey="subscriptions"
            name="Gói đăng ký"
            stackId="1"
            fill="#8b5cf6"
            radius={[0, 0, 0, 0]}
            animationDuration={1500}
          />
          <Bar
            dataKey="courseSales"
            name="Hoa hồng khóa học"
            stackId="1"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            animationDuration={1800}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueBreakdownChart;

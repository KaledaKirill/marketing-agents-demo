import { useId } from 'react';
import { useMediaQuery } from '@/lib/use-media-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
type Activity = { date: string; responses: number }[];
const tooltipStyle = {
  border: '1px solid #dfe6da',
  borderRadius: 10,
  fontSize: 12,
  boxShadow: '0 6px 20px #193e2814',
};
export function ActivityChart({ data }: { data: Activity }) {
  const id = useId().replace(/:/g, '');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  return (
    <div
      className="activity-chart"
      role="img"
      aria-label={`Illustrative response activity: ${data.map((d) => `${d.date}: ${d.responses}`).join(', ')}`}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#187767" stopOpacity={0.14} />
              <stop offset="100%" stopColor="#187767" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e9eee5" strokeDasharray="3 5" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            minTickGap={24}
            tick={{ fontSize: 11, fill: '#637268' }}
            dy={9}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#637268' }}
            tickCount={5}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ stroke: '#8dbfa9', strokeDasharray: '3 3' }}
          />
          <Area
            type="monotone"
            dataKey="responses"
            name="Responses"
            stroke="#187767"
            strokeWidth={2.5}
            fill={`url(#${id})`}
            activeDot={{ r: 4, stroke: 'white', strokeWidth: 3 }}
            isAnimationActive={!reducedMotion}
            animationDuration={1200}
            animationEasing="ease-in-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function DistributionChart({
  data,
  rating = false,
}: {
  data: { name: string; value: number }[];
  rating?: boolean;
}) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const summary = `Response distribution: ${data.map((d) => `${d.name}: ${d.value}`).join(', ')}`;
  if (!rating) {
    const maximum = Math.max(1, ...data.map((point) => point.value));
    return (
      <div className="distribution-bars" role="img" aria-label={summary}>
        {data.map((point) => (
          <div key={point.name} title={`${point.name}: ${point.value} responses`}>
            <div className="distribution-bar-label">
              <span>{point.name}</span>
              <span>{point.value.toLocaleString('en-US')}</span>
            </div>
            <div className="distribution-bar-track" aria-hidden="true">
              <div style={{ width: `${(point.value / maximum) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div
      className="distribution-chart"
      data-dense={data.length > 6}
      role="img"
      aria-label={summary}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} margin={{ top: 24, right: 8, left: -25, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#e9eee5" strokeDasharray="3 5" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#647966' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#637268' }}
            allowDecimals={false}
          />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f3f7ef' }} />
          <Bar
            dataKey="value"
            name="Responses"
            fill="#5b9b83"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
            isAnimationActive={!reducedMotion}
            animationDuration={1050}
            animationEasing="ease-in-out"
          >
            <LabelList dataKey="value" position="top" fill="#647966" fontSize={11} offset={8} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

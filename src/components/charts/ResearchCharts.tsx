import { useId } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
type Activity = { date: string; responses: number }[];
const tooltipStyle = {
  border: '1px solid #e9eaf0',
  borderRadius: 10,
  fontSize: 12,
  boxShadow: '0 4px 20px #1620400a',
};
export function ActivityChart({ data }: { data: Activity }) {
  const id = useId().replace(/:/g, '');
  return (
    <div
      className="h-[220px] w-full min-w-0"
      role="img"
      aria-label={`Illustrative response activity: ${data.map((d) => `${d.date}: ${d.responses}`).join(', ')}`}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 600, height: 220 }}
      >
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7666ed" stopOpacity={0.17} />
              <stop offset="100%" stopColor="#7666ed" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#eff0f4" strokeDasharray="3 4" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            minTickGap={24}
            tick={{ fontSize: 10, fill: '#98a0b2' }}
            dy={9}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#98a0b2' }}
            tickCount={5}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ stroke: '#b9aff7', strokeDasharray: '3 3' }}
          />
          <Area
            type="monotone"
            dataKey="responses"
            name="Responses"
            stroke="#7965e9"
            strokeWidth={2.5}
            fill={`url(#${id})`}
            activeDot={{ r: 4, stroke: 'white', strokeWidth: 3 }}
            isAnimationActive={false}
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
  return (
    <div
      className="h-56 min-w-0"
      role="img"
      aria-label={`Response distribution: ${data.map((d) => `${d.name}: ${d.value}`).join(', ')}`}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 500, height: 224 }}
      >
        <BarChart
          data={data}
          layout={rating ? 'horizontal' : 'vertical'}
          margin={
            rating
              ? { top: 10, right: 10, left: -25, bottom: 0 }
              : { top: 5, right: 25, left: 0, bottom: 0 }
          }
        >
          <CartesianGrid
            stroke="#eff0f4"
            horizontal={rating}
            vertical={!rating}
            strokeDasharray="3 4"
          />
          {rating ? (
            <>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#7d8597' }}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#98a0b2' }} />
            </>
          ) : (
            <>
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#98a0b2' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={122}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#7d8597' }}
                tickFormatter={(s: string) => (s.length > 20 ? `${s.slice(0, 18)}…` : s)}
              />
            </>
          )}
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f8f7ff' }} />
          <Bar
            dataKey="value"
            name="Responses"
            fill="#8a7aea"
            radius={rating ? [5, 5, 0, 0] : [0, 5, 5, 0]}
            maxBarSize={rating ? 44 : 23}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

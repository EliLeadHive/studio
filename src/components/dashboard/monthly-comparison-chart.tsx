'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils';

interface MonthlyComparisonChartProps {
  data: {
    month: string;
    Conversões: number;
    'CPL (R$)': number;
  }[];
  chartConfig: ChartConfig;
}

export function MonthlyComparisonChart({ data, chartConfig }: MonthlyComparisonChartProps) {
  return (
    <div className="h-[400px] w-full">
      <ChartContainer config={chartConfig} className="w-full h-full">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              fontSize={12}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              fontSize={12}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              fontSize={12}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip
                cursor={{ fill: 'hsl(var(--card))' }}
                content={<ChartTooltipContent 
                    formatter={(value, name) => {
                        if (name === 'CPL (R$)') {
                            return formatCurrency(value as number);
                        }
                        return value.toLocaleString();
                    }}
                />}
            />
            <Legend />
            <Bar 
                yAxisId="left"
                dataKey="Conversões" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]} 
            />
            <Line 
                yAxisId="right"
                type="monotone"
                dataKey="CPL (R$)"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                dot={{
                    r: 5,
                    fill: 'hsl(var(--accent))',
                    stroke: 'hsl(var(--card))',
                    strokeWidth: 2
                }}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}

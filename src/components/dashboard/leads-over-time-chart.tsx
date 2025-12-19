'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '../ui/chart';

interface LeadsOverTimeChartProps {
  data: {
    date: string;
    Leads: number;
  }[];
  chartConfig: ChartConfig;
}

export function LeadsOverTimeChart({ data, chartConfig }: LeadsOverTimeChartProps) {
  return (
    <Card className="bg-card shadow-md">
      <CardHeader>
        <CardTitle>Leads nos Últimos 30 Dias</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{
                  top: 5,
                  right: 20,
                  left: -10,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(str) => format(new Date(str), 'dd/MM', { locale: ptBR })}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'hsla(var(--primary), 0.1)' }}
                  content={<ChartTooltipContent />}
                />
                <Line
                  type="monotone"
                  dataKey="Leads"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{
                      r: 4,
                      fill: 'hsl(var(--primary))',
                      stroke: 'hsl(var(--card))'
                  }}
                  activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';
import { MonthlyMetric } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MonthlyComparisonChart } from './monthly-comparison-chart';
import { MonthlyComparisonTable } from './monthly-comparison-table';
import { ChartConfig } from '../ui/chart';
import { Card, CardContent } from '../ui/card';

interface MonthlyComparisonClientPageProps {
  title: string;
  summary: string;
  monthlyData: MonthlyMetric[];
}

export function MonthlyComparisonClientPage({ title, summary, monthlyData }: MonthlyComparisonClientPageProps) {

  const chartData = monthlyData.map(d => ({
    month: d.month.charAt(0).toUpperCase() + d.month.slice(1),
    Conversões: d.conversions,
    'CPL (R$)': d.cpl
  }));

  const chartConfig = {
    Conversões: {
      label: 'Conversões',
      color: 'hsl(var(--primary))',
    },
    'CPL (R$)': {
      label: 'CPL (R$)',
      color: 'hsl(var(--accent))',
    },
  } satisfies ChartConfig;


  return (
    <div className="space-y-8 animate-in fade-in-50">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground max-w-3xl mt-2">{summary}</p>
        </div>
        <div>
          {/* Note: Brand filter is not implemented yet */}
          <Select disabled>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todas as Marcas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Marcas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 md:p-6">
            <MonthlyComparisonChart data={chartData} chartConfig={chartConfig} />
        </CardContent>
      </Card>
      
      <MonthlyComparisonTable data={monthlyData} />

    </div>
  );
}

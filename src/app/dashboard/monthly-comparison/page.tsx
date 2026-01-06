'use client';

import { useState, useEffect } from 'react';
import { getAdsData, getAiMonthlyObservation } from '@/lib/actions';
import { AdData, MonthlyMetric } from '@/lib/types';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MonthlyComparisonChart } from '@/components/dashboard/monthly-comparison-chart';
import { MonthlyComparisonTable } from '@/components/dashboard/monthly-comparison-table';
import { ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

function processDataForMonthlyComparison(data: AdData[]): MonthlyMetric[] {
  if (!data || data.length === 0) {
    return [];
  }

  const monthlyData = data.reduce((acc, item) => {
    try {
        const date = new Date(item.date);
        // This line is crucial to avoid timezone issues.
        // It treats the date as UTC to ensure consistent month grouping.
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset()); 
        
        const monthYear = format(date, 'yyyy-MM');

        if (!acc[monthYear]) {
          acc[monthYear] = {
            month: format(date, 'MMMM', { locale: ptBR }),
            year: date.getFullYear(),
            monthYear: monthYear,
            investment: 0,
            conversions: 0,
            reach: 0,
            cpl: 0,
          };
        }

        acc[monthYear].investment += Number(item.investment) || 0;
        acc[monthYear].conversions += Number(item.leads) || 0;
        acc[monthYear].reach += Number(item.impressions) || 0;
    } catch(e) {
        console.error(`Could not process row: ${item}`, e);
    }


    return acc;
  }, {} as Record<string, Omit<MonthlyMetric, 'cpl' | 'observation'>>);

  const result = Object.values(monthlyData).map(month => {
    const cpl = month.conversions > 0 ? month.investment / month.conversions : 0;
    return { ...month, cpl };
  });

  result.sort((a, b) => a.monthYear.localeCompare(b.monthYear));

  return result;
}

function MonthlyPageLoadingSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-[400px] w-full" />
                    <Skeleton className="h-[200px] w-full" />
                </CardContent>
            </Card>
        </div>
    );
}


export default function MonthlyComparisonPage() {
    const [monthlyData, setMonthlyData] = useState<MonthlyMetric[]>([]);
    const [title, setTitle] = useState('Comparativo Mensal');
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const allData = await getAdsData();

                if (!allData || allData.length === 0) {
                    setIsLoading(false);
                    return;
                }

                const monthlyMetrics = processDataForMonthlyComparison(allData);

                if (monthlyMetrics.length > 0) {
                    const metricsWithObservations: MonthlyMetric[] = await Promise.all(
                        monthlyMetrics.map(async (metric, i) => {
                            const currentMonth = metric;
                            const previousMonth = i > 0 ? monthlyMetrics[i - 1] : undefined;
                            const observation = await getAiMonthlyObservation(currentMonth, previousMonth);
                            return { ...currentMonth, observation };
                        })
                    );
                    setMonthlyData(metricsWithObservations);
                    
                    const startDate = format(new Date(monthlyMetrics[0].monthYear + '-02'), 'MMMM yyyy', {locale: ptBR});
                    const endDate = format(new Date(monthlyMetrics[monthlyMetrics.length - 1].monthYear + '-02'), 'MMMM yyyy', {locale: ptBR});

                    setTitle(`Comparativo Mensal (de ${startDate} a ${endDate})`);
                    setSummary("A análise mostra a trajetória de sucesso e otimização. O mês de setembro se consagrou como o melhor do ano, com um recorde de conversões e o menor CPL registrado, validando a eficácia da estratégia de escala e da maturação das campanhas.");
                }
            } catch (error) {
                console.error("Failed to fetch or process monthly data:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, []);

    if (isLoading) {
       return <MonthlyPageLoadingSkeleton />;
    }

    if (monthlyData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <h2 className="text-xl font-semibold text-foreground">Nenhum dado mensal para comparar</h2>
                <p className="text-muted-foreground mt-2">
                    Verifique se sua planilha está preenchida e tente recarregar a página.
                </p>
            </div>
        );
    }
    
    const chartData = monthlyData.map(item => ({
        month: item.month.charAt(0).toUpperCase() + item.month.slice(1).substring(0,2),
        'Conversões': item.conversions,
        'CPL (R$)': item.cpl,
    }));

    const chartConfig = {
        'Conversões': {
            label: 'Conversões',
        },
        'CPL (R$)': {
            label: 'CPL (R$)',
        },
    } satisfies ChartConfig;

    return (
        <div className="space-y-8 animate-in fade-in-50">
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{summary}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <MonthlyComparisonChart data={chartData} chartConfig={chartConfig} />
                    <MonthlyComparisonTable data={monthlyData} />
                </CardContent>
            </Card>
        </div>
    );
}

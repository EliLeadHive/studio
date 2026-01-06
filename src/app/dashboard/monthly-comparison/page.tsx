import { getAdsData } from '@/lib/mock-data';
import { AdData, MonthlyMetric } from '@/lib/types';
import { notFound } from 'next/navigation';
import { MonthlyComparisonClientPage } from '@/components/dashboard/monthly-comparison-client-page';
import { getAiMonthlyObservation } from '@/lib/actions';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';

function processDataForMonthlyComparison(data: AdData[]): MonthlyMetric[] {
  if (!data || data.length === 0) {
    return [];
  }

  const monthlyData = data.reduce((acc, item) => {
    const date = new Date(item.date);
    // Add timezone offset to prevent off-by-one day errors
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

    acc[monthYear].investment += item.investment;
    acc[monthYear].conversions += item.leads;
    acc[monthYear].reach += item.impressions;

    return acc;
  }, {} as Record<string, Omit<MonthlyMetric, 'cpl'>>);

  const result = Object.values(monthlyData).map(month => {
    const cpl = month.conversions > 0 ? month.investment / month.conversions : 0;
    return { ...month, cpl };
  });

  // Sort by year then month
  result.sort((a, b) => a.monthYear.localeCompare(b.monthYear));

  return result;
}


export default async function MonthlyComparisonPage() {
  const allData = await getAdsData();

  if (!allData || allData.length === 0) {
    notFound();
  }

  const monthlyMetrics = processDataForMonthlyComparison(allData);

  // Generate AI observations for each month
  const metricsWithObservations: MonthlyMetric[] = [];
  for (let i = 0; i < monthlyMetrics.length; i++) {
    const currentMonth = monthlyMetrics[i];
    const previousMonth = i > 0 ? monthlyMetrics[i - 1] : undefined;
    const observation = await getAiMonthlyObservation(currentMonth, previousMonth);
    metricsWithObservations.push({ ...currentMonth, observation });
  }

  // Create a summary of the whole period
  const startDate = format(new Date(monthlyMetrics[0].monthYear), 'MMMM yyyy', {locale: ptBR});
  const endDate = format(new Date(monthlyMetrics[monthlyMetrics.length - 1].monthYear), 'MMMM yyyy', {locale: ptBR});
  const title = `Comparativo Mensal (de ${startDate} a ${endDate})`;

  const overallSummary = "A análise mostra a trajetória de sucesso e otimização. O mês de setembro se consagrou como o melhor do ano, com um recorde de conversões e o menor CPL registrado, validando a eficácia da estratégia de escala e da maturação das campanhas.";


  return (
    <MonthlyComparisonClientPage
      title={title}
      summary={overallSummary}
      monthlyData={metricsWithObservations}
    />
  );
}

import { getAdsData } from '@/lib/actions';
import { AdData } from '@/lib/types';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { DollarSign, Target, Users, MousePointerClick, Eye } from 'lucide-react';
import { BrandPerformanceChart } from '@/components/dashboard/brand-performance-chart';
import { ChartContainer, ChartConfig } from '@/components/ui/chart';
import { BRANDS } from '@/lib/types';
import { AiGeneralReport } from '@/components/dashboard/ai-general-report';

export default async function DashboardPage() {
  const data = await getAdsData();

  const totalInvestment = data.reduce((sum, item) => sum + item.investment, 0);
  const totalLeads = data.reduce((sum, item) => sum + item.leads, 0);
  const totalClicks = data.reduce((sum, item) => sum + item.clicks, 0);
  const totalImpressions = data.reduce((sum, item) => sum + item.impressions, 0);
  const averageCpl = totalLeads > 0 ? totalInvestment / totalLeads : 0;

  const brandData = data.reduce(
    (acc, item) => {
      if (!acc[item.brand]) {
        acc[item.brand] = { leads: 0 };
      }
      acc[item.brand].leads += item.leads;
      return acc;
    },
    {} as Record<string, { leads: number }>
  );

  const chartData = Object.entries(brandData).map(([name, values]) => ({
    name,
    Leads: values.leads,
  }));

  const chartConfig = {
    Leads: {
      label: 'Leads',
    },
    ...BRANDS.reduce((acc, brand) => {
      acc[brand] = {
        label: brand,
      };
      return acc;
    }, {} as Record<string, { label: string }>),
  } satisfies ChartConfig;

  return (
    <div className="space-y-8 animate-in fade-in-50">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="Investimento Total"
          value={formatCurrency(totalInvestment)}
          description="Soma do investimento em todas as marcas"
          icon={<DollarSign />}
          iconBgColorClass="bg-green-500/10"
          iconColorClass="text-green-400"
        />
        <KpiCard
          title="Leads Totais"
          value={formatNumber(totalLeads)}
          description="Soma de leads de todas as marcas"
          icon={<Users />}
          iconBgColorClass="bg-blue-500/10"
          iconColorClass="text-blue-400"
        />
        <KpiCard
          title="CPL Médio"
          value={formatCurrency(averageCpl)}
          description="Custo por Lead médio geral"
          icon={<Target />}
          iconBgColorClass="bg-orange-500/10"
          iconColorClass="text-orange-400"
        />
        <KpiCard
          title="Cliques"
          value={formatNumber(totalClicks)}
          description="Total de cliques em todos os anúncios"
          icon={<MousePointerClick />}
          iconBgColorClass="bg-purple-500/10"
          iconColorClass="text-purple-400"
        />
        <KpiCard
          title="Impressões"
          value={formatNumber(totalImpressions)}
          description="Total de impressões"
          icon={<Eye />}
          iconBgColorClass="bg-indigo-500/10"
          iconColorClass="text-indigo-400"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BrandPerformanceChart data={chartData} chartConfig={chartConfig} />
        <AiGeneralReport data={data} />
      </div>
    </div>
  );
}

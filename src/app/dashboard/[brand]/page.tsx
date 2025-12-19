import { getAdsData } from '@/lib/mock-data';
import { BRANDS, Brand } from '@/lib/types';
import { notFound } from 'next/navigation';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { DollarSign, Target, Users } from 'lucide-react';
import { LeadsOverTimeChart } from '@/components/dashboard/leads-over-time-chart';
import { AiSummary } from '@/components/dashboard/ai-summary';
import { ChartConfig } from '@/components/ui/chart';

interface BrandPageProps {
  params: {
    brand: string;
  };
}

// Helper to validate brand
const getValidBrand = (brandSlug: string): Brand | null => {
  const brand = BRANDS.find(b => b.toLowerCase() === brandSlug.toLowerCase());
  return brand || null;
}

export async function generateStaticParams() {
  return BRANDS.map((brand) => ({
    brand: brand.toLowerCase(),
  }))
}

export default async function BrandPage({ params }: BrandPageProps) {
  const brand = getValidBrand(params.brand);

  if (!brand) {
    notFound();
  }

  const brandData = await getAdsData({ brand });

  if (brandData.length === 0) {
    return <div className="text-center text-muted-foreground">Nenhum dado encontrado para {brand}.</div>;
  }

  const totalInvestment = brandData.reduce((sum, item) => sum + item.investment, 0);
  const totalLeads = brandData.reduce((sum, item) => sum + item.leads, 0);
  const averageCpl = totalInvestment / totalLeads;
  
  const chartData = brandData.map(item => ({
    date: item.date,
    Leads: item.leads,
  }));

  const chartConfig = {
    Leads: {
      label: 'Leads',
    },
    date: {
      label: 'Date',
    }
  } satisfies ChartConfig;

  return (
    <div className="space-y-8 animate-in fade-in-50">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Investimento"
          value={formatCurrency(totalInvestment)}
          description={`Total investido em ${brand}`}
          icon={<DollarSign />}
          iconBgColorClass="bg-green-500/10"
          iconColorClass="text-green-400"
        />
        <KpiCard
          title="Leads"
          value={formatNumber(totalLeads)}
          description={`Total de leads de ${brand}`}
          icon={<Users />}
          iconBgColorClass="bg-blue-500/10"
          iconColorClass="text-blue-400"
        />
        <KpiCard
          title="CPL Médio"
          value={formatCurrency(averageCpl)}
          description={`Custo por Lead médio de ${brand}`}
          icon={<Target />}
          iconBgColorClass="bg-orange-500/10"
          iconColorClass="text-orange-400"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
            <LeadsOverTimeChart data={chartData} chartConfig={chartConfig}/>
        </div>
        <div className="lg:col-span-2">
            <AiSummary brand={brand} data={brandData} />
        </div>
      </div>
    </div>
  );
}

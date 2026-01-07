
import { getAdsData } from '@/lib/actions';
import { BRANDS, Brand, AdData } from '@/lib/types';
import { notFound } from 'next/navigation';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { DollarSign, Target, Users, MousePointerClick, Eye } from 'lucide-react';
import { LeadsOverTimeChart } from '@/components/dashboard/leads-over-time-chart';
import { AiSummary } from '@/components/dashboard/ai-summary';
import { ChartConfig } from '@/components/ui/chart';
import { parseISO } from 'date-fns';
import { CampaignPerformance } from '@/components/dashboard/campaign-performance';

interface BrandPageProps {
  params: {
    brand: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
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

export interface CampaignMetrics {
    campaignName: string;
    investment: number;
    leads: number;
    clicks: number;
    impressions: number;
    cpl: number;
}

export default async function BrandPage({ params, searchParams }: BrandPageProps) {
  const brand = getValidBrand(params.brand);

  if (!brand) {
    notFound();
  }

  const from = searchParams?.from ? parseISO(searchParams.from as string) : undefined;
  const to = searchParams?.to ? parseISO(searchParams.to as string) : undefined;

  const brandData = await getAdsData({ brand, from, to });

  if (brandData.length === 0) {
    return <div className="text-center text-muted-foreground">Nenhum dado encontrado para {brand} no período selecionado.</div>;
  }

  const totalInvestment = brandData.reduce((sum, item) => sum + item.investment, 0);
  const totalLeads = brandData.reduce((sum, item) => sum + item.leads, 0);
  const totalClicks = brandData.reduce((sum, item) => sum + item.clicks, 0);
  const totalImpressions = brandData.reduce((sum, item) => sum + item.impressions, 0);
  const averageCpl = totalLeads > 0 ? totalInvestment / totalLeads : 0;
  
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

  const campaignData = Object.values(brandData.reduce((acc, item) => {
    const campaignName = item.campaignName || 'Campanha sem nome';
    if (!acc[campaignName]) {
        acc[campaignName] = { campaignName, investment: 0, leads: 0, clicks: 0, impressions: 0 };
    }
    acc[campaignName].investment += item.investment;
    acc[campaignName].leads += item.leads;
    acc[campaignName].clicks += item.clicks;
    acc[campaignName].impressions += item.impressions;
    return acc;
  }, {} as Record<string, Omit<CampaignMetrics, 'cpl'>>)).map(campaign => ({
    ...campaign,
    cpl: campaign.leads > 0 ? campaign.investment / campaign.leads : 0,
  })).sort((a, b) => b.leads - a.leads);


  return (
    <div className="space-y-8 animate-in fade-in-50">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
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
        <KpiCard
          title="Cliques"
          value={formatNumber(totalClicks)}
          description={`Total de cliques em ${brand}`}
          icon={<MousePointerClick />}
          iconBgColorClass="bg-purple-500/10"
          iconColorClass="text-purple-400"
        />
         <KpiCard
          title="Impressões"
          value={formatNumber(totalImpressions)}
          description={`Total de impressões em ${brand}`}
          icon={<Eye />}
          iconBgColorClass="bg-indigo-500/10"
          iconColorClass="text-indigo-400"
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

      <CampaignPerformance campaigns={campaignData} />
    </div>
  );
}

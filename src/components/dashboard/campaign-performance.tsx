
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { CampaignMetrics } from "@/app/dashboard/[brand]/page";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Badge } from "../ui/badge";

interface CampaignPerformanceProps {
  campaigns: CampaignMetrics[];
}

interface CampaignDetailCardProps {
    label: string;
    value: string;
}

function CampaignDetailCard({ label, value }: CampaignDetailCardProps) {
    return (
        <div className="flex flex-col gap-1 rounded-lg bg-background p-3 text-center">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold text-foreground">{value}</p>
        </div>
    );
}

export function CampaignPerformance({ campaigns }: CampaignPerformanceProps) {
  if (!campaigns || campaigns.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance por Campanha</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {campaigns.map((campaign, index) => (
            <AccordionItem value={`item-${index}`} key={index}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-1 items-center justify-between pr-4">
                    <p className="text-left font-medium text-foreground truncate flex-1">
                        {campaign.campaignName}
                    </p>
                    <div className="flex items-center gap-4 pl-4">
                        <Badge variant="secondary">{`${formatNumber(campaign.leads)} leads`}</Badge>
                        <Badge variant="outline">{`CPL ${formatCurrency(campaign.cpl)}`}</Badge>
                    </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg">
                    <CampaignDetailCard label="Investimento" value={formatCurrency(campaign.investment)} />
                    <CampaignDetailCard label="Leads" value={formatNumber(campaign.leads)} />
                    <CampaignDetailCard label="CPL" value={formatCurrency(campaign.cpl)} />
                    <CampaignDetailCard label="Cliques" value={formatNumber(campaign.clicks)} />
                    <CampaignDetailCard label="Impressões" value={formatNumber(campaign.impressions)} />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}

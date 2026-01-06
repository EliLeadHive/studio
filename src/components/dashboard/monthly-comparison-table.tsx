'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MonthlyMetric } from "@/lib/types"
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Card } from "../ui/card";


interface MonthlyComparisonTableProps {
    data: MonthlyMetric[];
}

export function MonthlyComparisonTable({ data }: MonthlyComparisonTableProps) {

  const formatMonth = (month: string) => {
    return month.charAt(0).toUpperCase() + month.slice(1).substring(0, 2);
  }

  return (
    <Card>
        <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-[80px]">Mês</TableHead>
                <TableHead className="text-right">Investimento</TableHead>
                <TableHead className="text-right">Conversões</TableHead>
                <TableHead className="text-right">Alcance</TableHead>
                <TableHead className="text-right">CPL</TableHead>
                <TableHead>Observação</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((metric) => (
                    <TableRow key={metric.monthYear}>
                        <TableCell className="font-medium">{formatMonth(metric.month)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(metric.investment)}</TableCell>
                        <TableCell className="text-right">{formatNumber(metric.conversions)}</TableCell>
                        <TableCell className="text-right">{formatNumber(metric.reach)}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(metric.cpl)}</TableCell>
                        <TableCell className="text-muted-foreground">{metric.observation}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </Card>
  )
}

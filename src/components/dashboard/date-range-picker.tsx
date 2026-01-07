
'use client';

import * as React from 'react';
import {
  format,
  subDays,
  startOfToday,
  endOfToday,
  startOfYesterday,
  endOfYesterday,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
} from 'date-fns';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


const PRESET_OPTIONS = {
    today: 'Hoje',
    yesterday: 'Ontem',
    last7: 'Últimos 7 dias',
    last14: 'Últimos 14 dias',
    last30: 'Últimos 30 dias',
    thisWeek: 'Esta semana',
    lastWeek: 'Semana passada',
    thisMonth: 'Este mês',
    lastMonth: 'Mês passado',
    custom: 'Personalizado'
}

export function DateRangePicker({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [preset, setPreset] = React.useState('custom');

  React.useEffect(() => {
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    if (fromParam) {
      setDateFrom(fromParam);
    }
    if (toParam) {
      setDateTo(toParam);
    }
    if(fromParam || toParam) {
        setPreset('custom');
    }
  }, [searchParams]);

  const applyDateChange = (from: string, to: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (from) {
      current.set('from', from);
    } else {
      current.delete('from');
    }

    if (to) {
      current.set('to', to);
    } else {
      current.delete('to');
    }
    
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);
  }

  const handleApply = () => {
    applyDateChange(dateFrom, dateTo);
  };
  
  const handlePresetChange = (value: string) => {
    setPreset(value);
    let fromDate, toDate;
    const today = new Date();

    switch(value) {
        case 'today':
            fromDate = startOfToday();
            toDate = endOfToday();
            break;
        case 'yesterday':
            fromDate = startOfYesterday();
            toDate = endOfYesterday();
            break;
        case 'last7':
            fromDate = subDays(today, 6);
            toDate = today;
            break;
        case 'last14':
            fromDate = subDays(today, 13);
            toDate = today;
            break;
        case 'last30':
            fromDate = subDays(today, 29);
            toDate = today;
            break;
        case 'thisWeek':
            fromDate = startOfWeek(today);
            toDate = endOfWeek(today);
            break;
        case 'lastWeek':
            const lastWeekStart = startOfWeek(subWeeks(today, 1));
            const lastWeekEnd = endOfWeek(subWeeks(today, 1));
            fromDate = lastWeekStart;
            toDate = lastWeekEnd;
            break;
        case 'thisMonth':
            fromDate = startOfMonth(today);
            toDate = endOfMonth(today);
            break;
        case 'lastMonth':
            const lastMonthStart = startOfMonth(subMonths(today, 1));
            const lastMonthEnd = endOfMonth(subMonths(today, 1));
            fromDate = lastMonthStart;
            toDate = lastMonthEnd;
            break;
        case 'custom':
            return; 
        default:
            return;
    }
    
    const formattedFrom = format(fromDate, 'yyyy-MM-dd');
    const formattedTo = format(toDate, 'yyyy-MM-dd');

    setDateFrom(formattedFrom);
    setDateTo(formattedTo);
    applyDateChange(formattedFrom, formattedTo);
  }

  const handleClear = () => {
    setDateFrom('');
    setDateTo('');
    setPreset('custom');
    applyDateChange('', '');
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 rounded-lg border bg-card text-card-foreground shadow-sm p-1.5">
        <div className="flex items-center gap-2">
            <Select value={preset} onValueChange={handlePresetChange}>
                <SelectTrigger className="w-auto h-7 text-xs" aria-label="Selecionar período">
                    <SelectValue placeholder="Selecione um período" />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(PRESET_OPTIONS).map(([key, value]) => (
                         <SelectItem key={key} value={key} className="text-xs">{value}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Label htmlFor="date-start" className="font-semibold text-xs shrink-0 px-1">De:</Label>
            <Input 
                type="date" 
                id="date-start" 
                value={dateFrom}
                onChange={(e) => {
                    setDateFrom(e.target.value)
                    setPreset('custom');
                }}
                className="w-auto h-7 text-xs"
                aria-label="Data de início"
            />
            <Label htmlFor="date-end" className="font-semibold text-xs shrink-0 px-1">Até:</Label>
            <Input 
                type="date" 
                id="date-end" 
                value={dateTo}
                onChange={(e) => {
                    setDateTo(e.target.value);
                    setPreset('custom');
                }}
                className="w-auto h-7 text-xs"
                aria-label="Data de fim"
            />
        </div>
        
        <div className="flex items-center gap-1">
            <Button onClick={handleApply} size="sm" className="h-7 px-2.5 text-xs">
                Atualizar
            </Button>
            <Button onClick={handleClear} variant="ghost" size="sm" className="h-7 px-2.5 text-xs">
                Limpar
            </Button>
        </div>
    </div>
  );
}

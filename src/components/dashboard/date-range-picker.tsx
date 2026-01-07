'use client';

import * as React from 'react';
import { format, parseISO, isValid, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Calendar as CalendarIcon } from 'lucide-react';
import { ptBR } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { DateRange } from 'react-day-picker';
import { Separator } from '../ui/separator';

const presets = [
    { value: 'today', label: 'Hoje' },
    { value: 'yesterday', label: 'Ontem' },
    { value: 'last7', label: 'Últimos 7 dias' },
    { value: 'last14', label: 'Últimos 14 dias' },
    { value: 'last30', label: 'Últimos 30 dias' },
    { value: 'thisMonth', label: 'Este mês' },
    { value: 'lastMonth', label: 'Mês passado' },
    { value: 'all', label: 'Máximo' },
];

export function DateRangePicker({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  const initialFrom = searchParams.get('from');
  const initialTo = searchParams.get('to');
  const [selectedPreset, setSelectedPreset] = React.useState<string | undefined>(undefined);

  const getInitialDateRange = (): DateRange | undefined => {
      if (initialFrom && initialTo) {
          const fromDate = parseISO(initialFrom);
          const toDate = parseISO(initialTo);
          if (isValid(fromDate) && isValid(toDate)) {
              return { from: fromDate, to: toDate };
          }
      }
      return undefined;
  }
  
  const [date, setDate] = React.useState<DateRange | undefined>(getInitialDateRange());

  React.useEffect(() => {
    setDate(getInitialDateRange());
  }, [initialFrom, initialTo]);

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    const now = new Date();
    let newRange: DateRange | undefined;

    switch (value) {
        case 'today':
            newRange = { from: now, to: now };
            break;
        case 'yesterday':
            const yesterday = subDays(now, 1);
            newRange = { from: yesterday, to: yesterday };
            break;
        case 'last7':
            newRange = { from: subDays(now, 6), to: now };
            break;
        case 'last14':
            newRange = { from: subDays(now, 13), to: now };
            break;
        case 'last30':
            newRange = { from: subDays(now, 29), to: now };
            break;
        case 'thisMonth':
            newRange = { from: startOfMonth(now), to: endOfMonth(now) };
            break;
        case 'lastMonth':
            const lastMonthStart = startOfMonth(subMonths(now, 1));
            const lastMonthEnd = endOfMonth(subMonths(now, 1));
            newRange = { from: lastMonthStart, to: lastMonthEnd };
            break;
        case 'all':
            newRange = undefined;
            break;
    }
    setDate(newRange);
  };
  
  const handleApply = () => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (date?.from) {
      current.set('from', format(date.from, 'yyyy-MM-dd'));
    } else {
      current.delete('from');
    }

    if (date?.to) {
      current.set('to', format(date.to, 'yyyy-MM-dd'));
    } else {
      current.delete('to');
    }

    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);
    setPopoverOpen(false);
  };

  const getButtonLabel = () => {
    if (initialFrom && initialTo) {
      const fromDateObj = parseISO(initialFrom);
      const toDateObj = parseISO(initialTo);
      if (isValid(fromDateObj) && isValid(toDateObj)) {
        return `${format(fromDateObj, 'dd/MM/yyyy')} - ${format(toDateObj, 'dd/MM/yyyy')}`;
      }
    }
    return "Máximo";
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[280px] justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>{getButtonLabel()}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex" align="end">
          <div className="flex-col space-y-2 p-4 pr-2 border-r border-border">
            <RadioGroup 
                onValueChange={handlePresetChange} 
                value={selectedPreset} 
                className="flex flex-col space-y-1"
            >
              {presets.map((preset) => (
                <div key={preset.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={preset.value} id={preset.value} />
                  <Label htmlFor={preset.value} className="font-normal">{preset.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="flex flex-col">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={(range) => {
                  setDate(range);
                  if (range?.from && range.to) {
                    setSelectedPreset(undefined);
                  }
              }}
              numberOfMonths={2}
              locale={ptBR}
            />
            <div className="flex items-center justify-end gap-2 p-4 pt-2 mt-auto border-t border-border">
                <Button
                    variant="ghost"
                    onClick={() => setPopoverOpen(false)}
                >
                    Cancelar
                </Button>
                <Button onClick={handleApply}>
                    Atualizar
                </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

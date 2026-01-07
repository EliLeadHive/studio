'use client';

import * as React from 'react';
import { addDays, addMonths, endOfMonth, format, startOfMonth, subDays, subMonths, parseISO, isValid, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '../ui/separator';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';

const PRESETS = [
    { value: 'today', label: 'Hoje', range: { from: new Date(), to: new Date() } },
    { value: 'yesterday', label: 'Ontem', range: { from: subDays(new Date(), 1), to: subDays(new Date(), 1) } },
    { value: 'last7', label: 'Últimos 7 dias', range: { from: subDays(new Date(), 6), to: new Date() } },
    { value: 'last14', label: 'Últimos 14 dias', range: { from: subDays(new Date(), 13), to: new Date() } },
    { value: 'last30', label: 'Últimos 30 dias', range: { from: subDays(new Date(), 29), to: new Date() } },
    { value: 'thisWeek', label: 'Esta semana', range: { from: startOfWeek(new Date(), { locale: ptBR }), to: endOfWeek(new Date(), { locale: ptBR }) } },
    { value: 'thisMonth', label: 'Este mês', range: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) } },
    { value: 'lastMonth', label: 'Mês passado', range: { from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) } },
    { value: 'all', label: 'Máximo', range: { from: undefined, to: undefined } },
] as const;


export function DateRangePicker({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  const appliedFrom = searchParams.get('from');
  const appliedTo = searchParams.get('to');
  
  const appliedDate = React.useMemo<DateRange | undefined>(() => {
    if (appliedFrom && appliedTo) {
      const fromDate = parseISO(appliedFrom);
      const toDate = parseISO(appliedTo);
      if (isValid(fromDate) && isValid(toDate)) {
        return { from: fromDate, to: toDate };
      }
    }
    return undefined;
  }, [appliedFrom, appliedTo]);
  
  const [selectedDate, setSelectedDate] = React.useState<DateRange | undefined>(appliedDate);
  const [selectedPreset, setSelectedPreset] = React.useState<string | undefined>(() => {
      if (!appliedDate) return 'all';
      for (const preset of PRESETS) {
          if (preset.range.from && appliedDate.from && format(preset.range.from, 'yyyy-MM-dd') === format(appliedDate.from, 'yyyy-MM-dd') &&
              preset.range.to && appliedDate.to && format(preset.range.to, 'yyyy-MM-dd') === format(appliedDate.to, 'yyyy-MM-dd')) {
              return preset.value;
          }
      }
      return 'custom';
  });


  React.useEffect(() => {
    if (popoverOpen) {
      setSelectedDate(appliedDate);
    }
  }, [popoverOpen, appliedDate]);
  
  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    if (value === 'custom') {
      return;
    }
    const preset = PRESETS.find(p => p.value === value);
    if (preset) {
        setSelectedDate(preset.range);
    }
  };

  const handleDateChange = (range: DateRange | undefined) => {
    setSelectedDate(range);
    // If user interacts with calendar, it's a custom range
    setSelectedPreset('custom');
  }

  const handleApply = () => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (selectedDate?.from) {
      current.set('from', format(selectedDate.from, 'yyyy-MM-dd'));
    } else {
      current.delete('from');
    }

    if (selectedDate?.to) {
      current.set('to', format(selectedDate.to, 'yyyy-MM-dd'));
    } else {
      // If there's a from but no to, use from as to
      if (selectedDate?.from) {
        current.set('to', format(selectedDate.from, 'yyyy-MM-dd'));
      } else {
        current.delete('to');
      }
    }

    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);
    setPopoverOpen(false);
  };
  
  const handleCancel = () => {
      setPopoverOpen(false);
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[260px] justify-start text-left font-normal',
              !appliedDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {appliedDate?.from ? (
              appliedDate.to ? (
                <>
                  {format(appliedDate.from, 'dd/MM/yyyy')} -{' '}
                  {format(appliedDate.to, 'dd/MM/yyyy')}
                </>
              ) : (
                format(appliedDate.from, 'dd/MM/yyyy')
              )
            ) : (
              <span>Máximo</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex" align="end">
            <div className="flex-col space-y-2 p-4 border-r border-border">
                <p className="text-sm font-medium text-foreground">Usados recentemente</p>
                <RadioGroup 
                    value={selectedPreset} 
                    onValueChange={handlePresetChange}
                    className="space-y-1"
                >
                    {PRESETS.map((preset) => (
                         <div key={preset.value} className="flex items-center space-x-2">
                             <RadioGroupItem value={preset.value} id={`preset-${preset.value}`} />
                             <Label htmlFor={`preset-${preset.value}`} className="font-normal cursor-pointer">{preset.label}</Label>
                         </div>
                    ))}
                    <div className="flex items-center space-x-2 pt-2">
                        <RadioGroupItem value="custom" id="preset-custom" />
                        <Label htmlFor="preset-custom" className="font-normal cursor-pointer">Personalizado</Label>
                    </div>
                </RadioGroup>
            </div>
            <div className="flex flex-col">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={selectedDate?.from}
                    selected={selectedDate}
                    onSelect={handleDateChange}
                    numberOfMonths={2}
                    locale={ptBR}
                    className="p-3"
                />
                <Separator />
                <div className="flex items-center justify-end gap-2 p-3">
                    <Button
                    variant="ghost"
                    onClick={handleCancel}
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
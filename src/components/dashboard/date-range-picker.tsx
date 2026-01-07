'use client';

import * as React from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, X } from 'lucide-react';
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

export function DateRangePicker({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  const appliedFrom = searchParams.get('from');
  const appliedTo = searchParams.get('to');

  // State for the currently applied date range, derived from URL
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

  // State for the date range being selected inside the popover
  const [selectedDate, setSelectedDate] = React.useState<DateRange | undefined>(appliedDate);

  // When the popover opens, sync the selected date with the applied one
  React.useEffect(() => {
    if (popoverOpen) {
      setSelectedDate(appliedDate);
    }
  }, [popoverOpen, appliedDate]);

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
  
  const handleClear = () => {
    setSelectedDate(undefined);
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.delete('from');
    current.delete('to');
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);
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
              <span>Selecione um período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={selectedDate?.from}
            selected={selectedDate}
            onSelect={setSelectedDate}
            numberOfMonths={2}
            locale={ptBR}
          />
          <Separator />
          <div className="flex items-center justify-end gap-2 p-3">
            <Button
              variant="ghost"
              onClick={handleClear}
              disabled={!appliedDate}
            >
              Limpar
            </Button>
            <Button onClick={handleApply} disabled={!selectedDate?.from}>
              Aplicar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

'use client';

import * as React from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '../ui/label';

export function DateRangePicker({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  // Get initial values from URL
  const initialFrom = searchParams.get('from');
  const initialTo = searchParams.get('to');

  // State to hold the temporary selections inside the popover
  const [fromDate, setFromDate] = React.useState<string | undefined>(initialFrom || undefined);
  const [toDate, setToDate] = React.useState<string | undefined>(initialTo || undefined);
  
  // Update internal state if URL changes from outside
  React.useEffect(() => {
    setFromDate(initialFrom || undefined);
    setToDate(initialTo || undefined);
  }, [initialFrom, initialTo]);


  const handleApply = () => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (fromDate) {
      current.set('from', fromDate);
    } else {
      current.delete('from');
    }

    if (toDate) {
      current.set('to', toDate);
    } else {
      current.delete('to');
    }

    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);
    setPopoverOpen(false);
  };
  
  const handleCancel = () => {
      setPopoverOpen(false);
      // Reset to initial values from URL on cancel
      setFromDate(initialFrom || undefined);
      setToDate(initialTo || undefined);
  }

  const getButtonLabel = () => {
    if (initialFrom && initialTo) {
        const fromDateObj = parseISO(initialFrom);
        const toDateObj = parseISO(initialTo);
        if (isValid(fromDateObj) && isValid(toDateObj)) {
            return `${format(fromDateObj, 'dd/MM/yyyy')} - ${format(toDateObj, 'dd/MM/yyyy')}`;
        }
    }
    return "Máximo";
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
              !initialFrom && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>{getButtonLabel()}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4 flex flex-col gap-4" align="end">
            <div className="flex items-center gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="date-start">De:</Label>
                    <Input 
                        id="date-start"
                        type="date" 
                        value={fromDate || ''}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="bg-input text-foreground"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="date-end">Até:</Label>
                    <Input 
                        id="date-end"
                        type="date"
                        value={toDate || ''}
                        onChange={(e) => setToDate(e.target.value)}
                        className="bg-input text-foreground"
                    />
                </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
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
        </PopoverContent>
      </Popover>
    </div>
  );
}

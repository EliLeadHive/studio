'use client';

import * as React from 'react';
import { isValid, parseISO } from 'date-fns';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function DateRangePicker({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize state to be empty on both server and client initially
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');

  // This useEffect runs only on the client, after hydration.
  // This prevents the server-rendered HTML from mismatching the client-rendered HTML.
  React.useEffect(() => {
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    if (fromParam) {
      setDateFrom(fromParam);
    }
    if (toParam) {
      setDateTo(toParam);
    }
  }, [searchParams]);

  const handleApply = () => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (dateFrom && isValid(parseISO(dateFrom))) {
      current.set('from', dateFrom);
    } else {
      current.delete('from');
    }

    if (dateTo && isValid(parseISO(dateTo))) {
      current.set('to', dateTo);
    } else {
      current.delete('to');
    }

    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);
  };

  const handleClear = () => {
    setDateFrom('');
    setDateTo('');
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.delete('from');
    current.delete('to');
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 rounded-lg border bg-card text-card-foreground shadow-sm p-1.5">
        <div className="flex items-center gap-1.5">
            <Label htmlFor="date-start" className="font-semibold text-xs shrink-0 px-1">De:</Label>
            <Input 
                type="date" 
                id="date-start" 
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-auto h-7 text-xs"
                aria-label="Data de início"
            />
        </div>
        <div className="flex items-center gap-1.5">
            <Label htmlFor="date-end" className="font-semibold text-xs shrink-0 px-1">Até:</Label>
            <Input 
                type="date" 
                id="date-end" 
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-auto h-7 text-xs"
                aria-label="Data de fim"
            />
        </div>
        <div className="flex items-center gap-1">
            <Button onClick={handleApply} size="sm" className="h-7 px-2.5">
                Atualizar
            </Button>
            <Button onClick={handleClear} variant="ghost" size="sm" className="h-7 px-2.5">
                Limpar
            </Button>
        </div>
    </div>
  );
}

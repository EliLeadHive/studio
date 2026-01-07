'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BRANDS } from '@/lib/types';
import { SidebarTrigger } from '../ui/sidebar';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import dynamic from 'next/dynamic';
import { Skeleton } from '../ui/skeleton';

const DateRangePicker = dynamic(() => import('./date-range-picker').then(mod => mod.DateRangePicker), {
  ssr: false,
  loading: () => (
     <div className="flex flex-col sm:flex-row items-center gap-2 rounded-lg border bg-card text-card-foreground shadow-sm p-1.5">
        <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-[130px]" />
            <Skeleton className="h-4 w-5" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-5" />
            <Skeleton className="h-7 w-32" />
        </div>
        <div className="flex items-center gap-1">
            <Skeleton className="h-7 w-[75px]" />
            <Skeleton className="h-7 w-[60px]" />
        </div>
    </div>
  ),
});


function getTitle(pathname: string): string {
  if (pathname === '/dashboard') {
    return 'Dashboard Executivo';
  }
  if (pathname.includes('/monthly-comparison')) {
    return 'Comparativo Mensal';
  }
  if (pathname.includes('/upload')) {
    return 'Upload de Dados';
  }
  const brandPath = pathname.split('/')[2];
  if (brandPath) {
    const brand = BRANDS.find(b => b.toLowerCase() === brandPath);
    return brand ? `Detalhes - ${brand}` : 'Dashboard';
  }
  return 'Dashboard';
}


export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleRefresh = () => {
    router.refresh();
  };

  const getPeriodLabel = (): string => {
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (from && to) {
        const fromDate = parseISO(from);
        const toDate = parseISO(to);
        if (isValid(fromDate) && isValid(toDate)) {
            if (format(fromDate, 'dd/MM/yyyy') === format(toDate, 'dd/MM/yyyy')) {
                return format(fromDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
            }
            return `${format(fromDate, 'dd/MM/yy')} - ${format(toDate, 'dd/MM/yy')}`;
        }
    }
    return "Todo o período";
  }

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 sm:px-8 py-3 flex justify-between items-center h-16">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden"/>
        <div>
            <h2 className="text-xl font-bold text-foreground">{getTitle(pathname)}</h2>
            <p className="text-xs text-muted-foreground">{getPeriodLabel()}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <DateRangePicker />
        <Button
          onClick={handleRefresh}
          variant="ghost"
          size="icon"
          aria-label="Recarregar dados"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

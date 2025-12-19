'use client';

import { usePathname, useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from './date-range-picker';
import { BRANDS } from '@/lib/types';
import { SidebarTrigger } from '../ui/sidebar';

function getTitle(pathname: string): string {
  if (pathname === '/dashboard') {
    return 'Dashboard Executivo';
  }
  const brandPath = pathname.split('/')[2];
  if (brandPath) {
    const brand = BRANDS.find(b => b.toLowerCase() === brandPath);
    return brand ? `Detalhes - ${brand}` : 'Dashboard';
  }
  return 'Dashboard';
}

function getPeriodLabel(): string {
  // This is static for now. In a real app, it would reflect the selected date range.
  return "Últimos 30 dias"
}


export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

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

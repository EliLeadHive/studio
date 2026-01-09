'use client';
import {
  Sidebar as SidebarPrimitive,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Car, PieChart, BarChart3, Link2, Upload } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { BRANDS } from '@/lib/types';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '../ui/scroll-area';
import Image from 'next/image';

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [lastSync, setLastSync] = useState('Aguardando...');

  useEffect(() => {
    // This value is client-side only to prevent hydration mismatch.
    setLastSync(format(new Date(), "dd/MM/yy 'às' HH:mm", { locale: ptBR }));
  }, [pathname]);

  const createUrlWithParams = (basePath: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const paramString = params.toString();
    return paramString ? `${basePath}?${paramString}` : basePath;
  };


  return (
    <SidebarPrimitive collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader>
        <div className="flex items-center justify-center p-4 h-20">
            <Image src="/logo.png" alt="Sinal Logo" width={150} height={50} className="group-data-[collapsible=icon]:hidden"/>
            <Image src="/logo.png" alt="Sinal Logo" width={32} height={32} className="hidden group-data-[collapsible=icon]:block"/>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Visão Geral</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/dashboard'}
                tooltip="Dashboard Executivo"
              >
                <Link href={createUrlWithParams('/dashboard')}>
                  <PieChart />
                  <span>Dashboard Executivo</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/monthly-comparison')} tooltip="Comparativo Mensal">
                <Link href={createUrlWithParams('/dashboard/monthly-comparison')}>
                  <BarChart3 />
                  <span>Comparativo Mensal</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/dashboard/upload'}
                tooltip="Upload de Dados"
              >
                <Link href={createUrlWithParams('/dashboard/upload')}>
                  <Upload />
                  <span>Upload de Dados</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Marcas</SidebarGroupLabel>
          <ScrollArea className="h-[calc(100vh-320px)]">
            <SidebarMenu>
              {BRANDS.map((brand) => (
                <SidebarMenuItem key={brand}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `/dashboard/${brand.toLowerCase()}`}
                    tooltip={brand}
                  >
                    <Link href={createUrlWithParams(`/dashboard/${brand.toLowerCase()}`)}>
                      <Car />
                      <span>{brand}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </ScrollArea>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:p-0">
         <div className="bg-card rounded-lg p-3 flex items-center gap-3 border border-border group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center">
            <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs border shrink-0">
                <Link2 className="w-4 h-4" />
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
                <p className="text-xs font-bold text-foreground">Fonte de Dados</p>
                <p className="text-[10px] text-muted-foreground" id="last-sync">{lastSync === 'Aguardando...' ? lastSync : `Sincronizado: ${lastSync}`}</p>
            </div>
        </div>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}

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
import { Car, Link2, MapPin, PieChart, Upload, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BRANDS } from '@/lib/types';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '../ui/scroll-area';

export function Sidebar() {
  const pathname = usePathname();
  const [lastSync, setLastSync] = useState('Aguardando...');

  useEffect(() => {
    // In a real app, this would come from the data source
    setLastSync(format(new Date(), "dd/MM/yy 'às' HH:mm", { locale: ptBR }));
  }, [pathname]);

  return (
    <SidebarPrimitive collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader>
        <div className="flex items-center gap-3 p-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">
            S
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h1 className="font-bold text-lg leading-none text-foreground">GRUPO SINAL</h1>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Intelligence Hub
            </span>
          </div>
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
                <Link href="/dashboard">
                  <PieChart />
                  <span>Dashboard Executivo</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/monthly-comparison')} tooltip="Comparativo Mensal">
                <Link href="/dashboard/monthly-comparison">
                  <BarChart3 />
                  <span>Comparativo Mensal</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Marcas</SidebarGroupLabel>
          <ScrollArea className="h-[calc(100vh-400px)]">
            <SidebarMenu>
              {BRANDS.map((brand) => (
                <SidebarMenuItem key={brand}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `/dashboard/${brand.toLowerCase()}`}
                    tooltip={brand}
                  >
                    <Link href={`/dashboard/${brand.toLowerCase()}`}>
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
                <p className="text-[10px] text-muted-foreground" id="last-sync">{`Sincronizado: ${lastSync}`}</p>
            </div>
        </div>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}

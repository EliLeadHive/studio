import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  iconBgColorClass?: string;
  iconColorClass?: string;
}

export function KpiCard({ title, value, description, icon, iconBgColorClass = 'bg-primary/10', iconColorClass = 'text-primary' }: KpiCardProps) {
  return (
    <Card className="bg-card shadow-md transition-all duration-300 hover:shadow-primary/20 hover:-translate-y-1 border-transparent hover:border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("p-2.5 rounded-lg", iconBgColorClass)}>
            <div className={cn("w-5 h-5", iconColorClass)}>
                {icon}
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

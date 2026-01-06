// src/components/dashboard/ai-general-report.tsx
'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Loader2 } from 'lucide-react';
import { AdData } from '@/lib/types';
import { getAiGeneralReport } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="sm">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Gerando Relatório...
        </>
      ) : (
        <>
          <Lightbulb className="mr-2 h-4 w-4" />
          Gerar Relatório Geral com IA
        </>
      )}
    </Button>
  );
}

export function AiGeneralReport({ data }: { data: AdData[] }) {
  const { toast } = useToast();
  const initialState = { message: '', summary: '' };
  const getAiReportWithData = getAiGeneralReport.bind(null, data);
  const [state, formAction] = useActionState(getAiReportWithData, initialState);

  useEffect(() => {
    if (state.message === 'error' && state.summary) {
      toast({
        variant: "destructive",
        title: "Erro no Relatório de IA",
        description: state.summary,
      });
    }
  }, [state, toast]);

  return (
    <Card className="bg-card shadow-md">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Análise Geral (IA)</CardTitle>
        <form action={formAction}>
          <SubmitButton />
        </form>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg bg-background p-4 border border-dashed border-border min-h-[150px] flex items-center justify-center">
          {state.message === 'success' && state.summary ? (
             <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>Relatório Gerado!</AlertTitle>
                <AlertDescription className="prose prose-sm prose-invert text-foreground whitespace-pre-wrap">
                  {state.summary}
                </AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Lightbulb className="h-8 w-8 text-muted-foreground mb-2" />
              <h3 className="font-semibold text-md text-foreground">Relatório Inteligente</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Clique no botão para gerar um relatório geral da performance de todas as marcas.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

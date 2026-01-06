'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Loader2, ServerCrash } from 'lucide-react';
import { AdData, Brand } from '@/lib/types';
import { getAiSummary } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Gerando...
        </>
      ) : (
        <>
          <Lightbulb className="mr-2 h-4 w-4" />
          Gerar Análise com IA
        </>
      )}
    </Button>
  );
}

export function AiSummary({ brand, data }: { brand: Brand; data: AdData[] }) {
  const { toast } = useToast();
  const initialState = { message: '', summary: '' };
  const getAiSummaryWithData = getAiSummary.bind(null, brand, data);
  const [state, formAction] = useActionState(getAiSummaryWithData, initialState);

  useEffect(() => {
    if (state.message === 'error' && state.summary) {
      toast({
        variant: "destructive",
        title: "Erro na Análise de IA",
        description: state.summary,
      });
    }
  }, [state, toast]);


  return (
    <Card className="bg-card shadow-md h-full flex flex-col">
      <CardHeader>
        <CardTitle>Análise de Performance (IA)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow">
        <form action={formAction} className="mb-4">
          <SubmitButton />
        </form>
        <div className="flex-grow rounded-lg bg-background p-4 border border-dashed border-border">
          {state.message === 'success' && state.summary ? (
             <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>Análise Gerada!</AlertTitle>
                <AlertDescription className="prose prose-sm prose-invert text-foreground">
                    <p className="whitespace-pre-wrap">{state.summary}</p>
                </AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Lightbulb className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg text-foreground">Insights sob demanda</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Clique no botão acima para gerar uma análise detalhada da performance da marca com inteligência artificial.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

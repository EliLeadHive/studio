'use server';
/**
 * @fileOverview Generates an observation for a month's performance data.
 *
 * - generateMonthlyObservation - A function that generates the observation.
 * - GenerateMonthlyObservationInput - The input type for the generateMonthlyObservation function.
 * - GenerateMonthlyObservationOutput - The return type for the generateMonthlyObservation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { MonthlyMetric } from '@/lib/types';

const MonthlyMetricSchema = z.object({
  month: z.string(),
  year: z.number(),
  monthYear: z.string(),
  investment: z.number(),
  conversions: z.number(),
  reach: z.number(),
  cpl: z.number(),
});

const GenerateMonthlyObservationInputSchema = z.object({
  currentMonth: MonthlyMetricSchema.describe("The metrics for the current month."),
  previousMonth: MonthlyMetricSchema.optional().describe("The metrics for the previous month, for comparison."),
});

export type GenerateMonthlyObservationInput = z.infer<typeof GenerateMonthlyObservationInputSchema>;

const GenerateMonthlyObservationOutputSchema = z.object({
  observation: z.string().describe('A short, insightful observation about the month\'s performance. Max 1-2 sentences. Example: "Mês recorde de conversões e menor CPL do ano."'),
});
export type GenerateMonthlyObservationOutput = z.infer<typeof GenerateMonthlyObservationOutputSchema>;

export async function generateMonthlyObservation(input: GenerateMonthlyObservationInput): Promise<GenerateMonthlyObservationOutput> {
  return generateMonthlyObservationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMonthlyObservationPrompt',
  input: { schema: GenerateMonthlyObservationInputSchema },
  output: { schema: GenerateMonthlyObservationOutputSchema },
  prompt: `You are a marketing analyst. Analyze the provided monthly metrics and generate a short, insightful observation (in Brazilian Portuguese).
Focus on the most important change or outcome for the month.

Current Month ({{currentMonth.month}}):
- Investment: R$ {{currentMonth.investment}}
- Conversions: {{currentMonth.conversions}}
- CPL: R$ {{currentMonth.cpl}}

{{#if previousMonth}}
Previous Month ({{previousMonth.month}}):
- Investment: R$ {{previousMonth.investment}}
- Conversions: {{previousMonth.conversions}}
- CPL: R$ {{previousMonth.cpl}}
{{/if}}

Based on this data, provide a concise observation.
Examples:
- "Início do ano, CPL ok"
- "Pequeno crescimento"
- "Maior volume, CPL subiu"
- "Melhor custo-benefício"
- "Investimento escalado, CPL saudável"
- "Performance consistente e escalável"
- "Leve aumento no CPL, volume saudável."
- "CPL reduzido com aumento de conversões."
- "Mês recorde de conversões e menor CPL do ano."
`,
});

const generateMonthlyObservationFlow = ai.defineFlow(
  {
    name: 'generateMonthlyObservationFlow',
    inputSchema: GenerateMonthlyObservationInputSchema,
    outputSchema: GenerateMonthlyObservationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

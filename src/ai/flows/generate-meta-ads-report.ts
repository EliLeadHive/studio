// src/ai/flows/generate-meta-ads-report.ts
'use server';
/**
 * @fileOverview Generates a performance report for each car brand from Meta Ads data.
 *
 * - generateMetaAdsReport - A function that generates the report.
 * - GenerateMetaAdsReportInput - The input type for the generateMetaAdsReport function.
 * - GenerateMetaAdsReportOutput - The return type for the generateMetaAdsReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMetaAdsReportInputSchema = z.object({
  metaAdsData: z.string().describe('The Meta Ads data in CSV format.'),
});
export type GenerateMetaAdsReportInput = z.infer<typeof GenerateMetaAdsReportInputSchema>;

const GenerateMetaAdsReportOutputSchema = z.object({
  report: z.string().describe('The generated performance report for each car brand.'),
});
export type GenerateMetaAdsReportOutput = z.infer<typeof GenerateMetaAdsReportOutputSchema>;

export async function generateMetaAdsReport(input: GenerateMetaAdsReportInput): Promise<GenerateMetaAdsReportOutput> {
  return generateMetaAdsReportFlow(input);
}

const generateReportPrompt = ai.definePrompt({
  name: 'generateReportPrompt',
  input: {schema: GenerateMetaAdsReportInputSchema},
  output: {schema: GenerateMetaAdsReportOutputSchema},
  prompt: `You are an expert marketing analyst. Analyze the Meta Ads data provided in CSV format and generate a concise performance report for each car brand.

      Data: {{{metaAdsData}}}

      The report should include key metrics such as total leads, cost per lead (CPL), and any other relevant insights.
      Format the report in a way that is easy to understand and visually appealing.
      Focus on providing actionable insights and recommendations for improving campaign performance.
    `,
});

const generateMetaAdsReportFlow = ai.defineFlow(
  {
    name: 'generateMetaAdsReportFlow',
    inputSchema: GenerateMetaAdsReportInputSchema,
    outputSchema: GenerateMetaAdsReportOutputSchema,
  },
  async input => {
    const {output} = await generateReportPrompt(input);
    return output!;
  }
);

'use server';

/**
 * @fileOverview A flow that summarizes insights from Meta Ads data for each brand.
 *
 * - summarizeAdsInsights - A function that handles the summarization process.
 * - SummarizeAdsInsightsInput - The input type for the summarizeAdsInsights function.
 * - SummarizeAdsInsightsOutput - The return type for the summarizeAdsInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeAdsInsightsInputSchema = z.object({
  brandName: z.string().describe('The name of the brand to summarize ad insights for.'),
  adsData: z.string().describe('The Meta Ads data for the brand, in CSV format.'),
});
export type SummarizeAdsInsightsInput = z.infer<typeof SummarizeAdsInsightsInputSchema>;

const SummarizeAdsInsightsOutputSchema = z.object({
  summary: z.string().describe('A clear and concise summary of the key findings and trends from the Meta Ads data for the specified brand.'),
});
export type SummarizeAdsInsightsOutput = z.infer<typeof SummarizeAdsInsightsOutputSchema>;

export async function summarizeAdsInsights(input: SummarizeAdsInsightsInput): Promise<SummarizeAdsInsightsOutput> {
  return summarizeAdsInsightsFlow(input);
}

const summarizeAdsInsightsPrompt = ai.definePrompt({
  name: 'summarizeAdsInsightsPrompt',
  input: {schema: SummarizeAdsInsightsInputSchema},
  output: {schema: SummarizeAdsInsightsOutputSchema},
  prompt: `You are an expert marketing analyst specializing in Meta Ads data.

You will analyze the provided Meta Ads data for a specific brand and generate a clear and concise summary of the key findings and trends. The summary should be easily understandable by someone with limited marketing knowledge.

Brand Name: {{{brandName}}}
Meta Ads Data (CSV):
{{#if adsData}}{{{adsData}}}{{else}}No data provided.{{/if}}`,
});

const summarizeAdsInsightsFlow = ai.defineFlow(
  {
    name: 'summarizeAdsInsightsFlow',
    inputSchema: SummarizeAdsInsightsInputSchema,
    outputSchema: SummarizeAdsInsightsOutputSchema,
  },
  async input => {
    const {output} = await summarizeAdsInsightsPrompt(input);
    return output!;
  }
);

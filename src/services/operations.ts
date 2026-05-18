import { supabase } from '../lib/supabase';
import type { OperationsSummary } from '../types/operations';

interface OperationsSummaryResponse {
  summary: OperationsSummary;
}

async function parseFunctionError(error: unknown) {
  const response = (error as { context?: Response }).context;
  if (!response) return error instanceof Error ? error.message : 'Nao foi possivel carregar a operacao.';

  try {
    const body = await response.json() as { error?: string };
    return body.error || 'Nao foi possivel carregar a operacao.';
  } catch {
    return 'Nao foi possivel carregar a operacao.';
  }
}

export async function getOperationsSummary(): Promise<OperationsSummary> {
  const { data, error } = await supabase.functions.invoke<OperationsSummaryResponse>('operations-summary', {
    body: {},
  });

  if (error) throw new Error(await parseFunctionError(error));
  if (!data?.summary) throw new Error('Resumo operacional indisponivel.');
  return data.summary;
}

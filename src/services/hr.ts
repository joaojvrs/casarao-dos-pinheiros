import { supabase } from '../lib/supabase';
import type {
  HRSummary,
  HRWeeklyReportRow,
  SaveEmployeeInput,
  SaveOccurrenceInput,
  SaveScheduleInput,
  SaveTimeRecordInput,
} from '../types/hr';

type HRAction =
  | 'summary'
  | 'save_employee'
  | 'save_schedule'
  | 'save_time_record'
  | 'save_occurrence'
  | 'get_weekly_report';

interface FunctionResponse<T> {
  data: T;
}

async function parseFunctionError(error: unknown) {
  const response = (error as { context?: Response }).context;
  if (!response) return error instanceof Error ? error.message : 'Nao foi possivel concluir a operacao.';

  try {
    const body = await response.json() as { error?: string };
    return body.error || 'Nao foi possivel concluir a operacao.';
  } catch {
    return 'Nao foi possivel concluir a operacao.';
  }
}

async function invokeHR<T>(action: HRAction, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke<FunctionResponse<T>>('hr-operations', {
    body: { action, payload },
  });

  if (error) throw new Error(await parseFunctionError(error));
  if (!data) throw new Error('Operacao sem retorno do modulo de RH.');
  return data.data;
}

export function getHRSummary(weekStart?: string) {
  return invokeHR<HRSummary>('summary', weekStart ? { weekStart } : {});
}

export function saveHREmployee(input: SaveEmployeeInput) {
  return invokeHR<{ id: string }>('save_employee', input as unknown as Record<string, unknown>);
}

export function saveHRSchedule(input: SaveScheduleInput) {
  return invokeHR<{ id: string }>('save_schedule', input as unknown as Record<string, unknown>);
}

export function saveHRTimeRecord(input: SaveTimeRecordInput) {
  return invokeHR<{ id: string }>('save_time_record', input as unknown as Record<string, unknown>);
}

export function saveHROccurrence(input: SaveOccurrenceInput) {
  return invokeHR<{ id: string }>('save_occurrence', input as unknown as Record<string, unknown>);
}

export function getHRWeeklyReport(periodStart: string, periodEnd: string) {
  return invokeHR<HRWeeklyReportRow[]>('get_weekly_report', { periodStart, periodEnd });
}

export function downloadWeeklyReportCSV(rows: HRWeeklyReportRow[], filename = 'relatorio-rh.csv') {
  const headers = ['Nome', 'Cargo', 'Setor', 'Total Horas', 'Extras', 'Faltas', 'Ocorrencias'];
  const lines = [
    headers.join(';'),
    ...rows.map(r =>
      [r.nome, r.cargo, r.setor, r.total_horas, r.extras, r.faltas, r.ocorrencias].join(';'),
    ),
  ];
  const csv = '﻿' + lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

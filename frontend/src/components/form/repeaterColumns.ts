import type { RepeaterColumn } from '@/types';
import { cncChoicesFromOptions } from './CncToggle';

export type ExpandedRepeaterCol =
  | { kind: 'field'; col: RepeaterColumn }
  | { kind: 'cnc'; col: RepeaterColumn; choice: 'C' | 'NC' | 'NA' };

export function expandRepeaterColumns(columns: RepeaterColumn[]): ExpandedRepeaterCol[] {
  const result: ExpandedRepeaterCol[] = [];
  for (const col of columns) {
    if (col.type === 'CHECKLIST') {
      for (const choice of cncChoicesFromOptions(col.options?.choices)) {
        result.push({ kind: 'cnc', col, choice });
      }
    } else {
      result.push({ kind: 'field', col });
    }
  }
  return result;
}

export function cncHeaderClass(choice: 'C' | 'NC' | 'NA'): string {
  if (choice === 'C') return 'bg-green-50';
  if (choice === 'NC') return 'bg-red-50';
  return '';
}

export function cncCellClass(choice: 'C' | 'NC' | 'NA'): string {
  if (choice === 'C') return 'bg-green-50/60';
  if (choice === 'NC') return 'bg-red-50/60';
  return '';
}

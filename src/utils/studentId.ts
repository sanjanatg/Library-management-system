import { DeptCode, DeptCodeList } from '@/constants/departments';

const PREFIX = '1cd';

export function normalizeStudentId(input: string): string {
  const raw = (input || '').trim().toLowerCase();
  const digits = raw.replace(/[^a-z0-9]/g, '');
  let s = digits;
  if (s.startsWith('1cd')) s = s.slice(3);
  const yy = s.slice(0, 2).replace(/[^0-9]/g, '');
  const rest = s.slice(2);
  const br = rest.slice(0, 2).toUpperCase() as DeptCode;
  const roll = rest.slice(2).replace(/[^0-9]/g, '');
  const yy2 = (yy || '').padStart(2, '0').slice(0, 2);
  const br2 = (DeptCodeList.includes(br) ? br : '').toLowerCase();
  const roll3 = (roll || '').padStart(3, '0').slice(0, 3);
  if (!yy2 || !br2 || !roll3) return `${PREFIX}${yy2}${br2}${roll3}`;
  return `${PREFIX}${yy2}${br2}${roll3}`;
}

export function validateStudentId(input: string): boolean {
  if (!input) return false;
  const id = normalizeStudentId(input);
  return /^1cd\d{2}(is|cs|me|cv|ds|it|ee|ec)\d{3}$/.test(id);
}

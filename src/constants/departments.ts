export type DeptCode = 'IS' | 'CS' | 'ME' | 'CV' | 'DS' | 'IT' | 'EE' | 'EC';

export const DEPARTMENT_CODES: { code: DeptCode; name: string }[] = [
  { code: 'IS', name: 'Information Science and Engineering' },
  { code: 'CS', name: 'Computer Science and Engineering' },
  { code: 'ME', name: 'Mechanical Engineering' },
  { code: 'CV', name: 'Civil Engineering' },
  { code: 'DS', name: 'Data Science' },
  { code: 'IT', name: 'Internet of Things' },
  { code: 'EE', name: 'Electrical and Electronics Engineering' },
  { code: 'EC', name: 'Electronics and Communication Engineering' },
];

export const DeptCodeList = DEPARTMENT_CODES.map((d) => d.code);
